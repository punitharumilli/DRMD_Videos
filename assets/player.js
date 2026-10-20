/* DRMD video guides: page set-up and video player. No external libraries. */
(function () {
  'use strict';

  var VIDEOS = Array.isArray(window.DRMD_VIDEOS) ? window.DRMD_VIDEOS : [];
  var SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    return h ? h + ':' + pad2(m) + ':' + pad2(s) : m + ':' + pad2(s);
  }

  function spoken(sec) {
    sec = Math.max(0, Math.floor(sec || 0));
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60, out = [];
    if (h) out.push(h + (h === 1 ? ' hour' : ' hours'));
    if (m) out.push(m + (m === 1 ? ' minute' : ' minutes'));
    if (s || !out.length) out.push(s + (s === 1 ? ' second' : ' seconds'));
    return out.join(' ');
  }

  // Accepts 88, 88.5, 1:28, 1m28s
  function parseTime(v) {
    if (!v) return null;
    if (/^\d+(\.\d+)?$/.test(v)) return parseFloat(v);
    var m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(v);
    if (m && (m[1] || m[2] || m[3])) return (+m[1] || 0) * 3600 + (+m[2] || 0) * 60 + (+m[3] || 0);
    var p = v.split(':');
    if (p.length >= 2 && p.length <= 3 && p.every(function (x) { return /^\d+$/.test(x); })) {
      return p.reduce(function (a, x) { return a * 60 + Number(x); }, 0);
    }
    return null;
  }

  var store = {
    get: function (k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { window.localStorage.setItem(k, String(v)); } catch (e) { /* storage unavailable */ } },
    del: function (k) { try { window.localStorage.removeItem(k); } catch (e) { /* storage unavailable */ } }
  };

  function speedLabel(r) { return r === 1 ? 'Normal' : String(r).replace(/\.0+$/, '') + '×'; }

  /* ---------------- Page ---------------- */

  var params = new URLSearchParams(window.location.search);
  var current = VIDEOS.filter(function (v) { return v.id === params.get('v'); })[0] || VIDEOS[0];

  if (!current) {
    $('#watch-area').hidden = true;
    $('#empty').hidden = false;
    return;
  }

  var chapters = (current.chapters || [])
    .map(function (c) { return { start: Number(c[0]) || 0, title: String(c[1] || '') }; })
    .sort(function (a, b) { return a.start - b.start; });

  document.title = current.title + ' – DRMD video guides';
  $('#v-title').textContent = current.title;
  $('#v-desc').textContent = current.description || '';

  (function meta() {
    var bits = [];
    if (current.duration) bits.push('Length ' + current.duration);
    if (current.language) bits.push(current.language);
    if (current.captionsInVideo) bits.push('Captions shown in the video');
    if (chapters.length) bits.push(chapters.length + ' chapters');
    var box = $('#v-meta');
    bits.forEach(function (b) { var s = document.createElement('span'); s.textContent = b; box.appendChild(s); });
  })();

  var download = $('#v-download');
  download.href = current.file;
  download.querySelector('span').textContent = 'Download video (MP4' + (current.size ? ', ' + current.size : '') + ')';
  $('.p-error__link').href = current.file;

  var statusEl = $('#status'), statusTimer = 0;
  function status(msg) {
    statusEl.textContent = msg;
    clearTimeout(statusTimer);
    statusTimer = setTimeout(function () { statusEl.textContent = ''; }, 5000);
  }

  // All videos (shown only when there is more than one)
  if (VIDEOS.length > 1) {
    var grid = $('#more-grid');
    VIDEOS.forEach(function (v) {
      var a = document.createElement('a');
      a.className = 'card';
      a.href = '?v=' + encodeURIComponent(v.id);
      if (v === current) a.setAttribute('aria-current', 'page');
      if (v.poster) {
        var img = document.createElement('img');
        img.src = v.poster; img.alt = ''; img.loading = 'lazy'; img.width = 640; img.height = 360;
        a.appendChild(img);
      }
      var body = document.createElement('div'); body.className = 'card__body';
      var t = document.createElement('div'); t.className = 'card__title'; t.textContent = v.title;
      var m = document.createElement('div'); m.className = 'card__meta';
      m.textContent = [v.duration, v.language].filter(Boolean).join(', ');
      body.appendChild(t); body.appendChild(m); a.appendChild(body);
      grid.appendChild(a);
    });
    $('#more').hidden = false;
  }

  /* ---------------- Player ---------------- */

  var player = $('#player');
  var video = $('#video');
  player.setAttribute('aria-label', 'Video player: ' + current.title);
  video.src = current.file;
  if (current.poster) video.poster = current.poster;
  if (current.captions) {
    var track = document.createElement('track');
    track.kind = 'captions';
    track.label = current.language || 'Captions';
    track.srclang = (current.lang || 'en');
    track.src = current.captions;
    video.appendChild(track);
  }

  /* Chapters panel */
  if (chapters.length) {
    var list = $('.chapters__list');
    $('.chapters__count').textContent = chapters.length + ' chapters';
    chapters.forEach(function (c, i) {
      var li = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chapter';
      b.dataset.index = i;
      b.setAttribute('aria-label', 'Chapter ' + (i + 1) + ', ' + c.title + ', starts at ' + spoken(c.start));
      var tt = document.createElement('span'); tt.className = 'chapter__time'; tt.textContent = fmt(c.start);
      var nn = document.createElement('span'); nn.textContent = c.title;
      b.appendChild(tt); b.appendChild(nn);
      b.addEventListener('click', function () { seekTo(c.start, true); });
      li.appendChild(b); list.appendChild(li);
    });
    $('#chapters').hidden = false;

    // Keep the chapter list as tall as the player on wide screens
    var fit = function () {
      var head = $('.chapters__head');
      if (window.matchMedia('(min-width: 1081px)').matches) {
        list.style.maxHeight = Math.max(160, player.offsetHeight - head.offsetHeight - 2) + 'px';
      } else {
        list.style.maxHeight = '';
      }
    };
    if (window.ResizeObserver) new ResizeObserver(fit).observe(player);
    window.addEventListener('resize', fit);
    fit();
  }

  var api = null;
  try {
    api = setUpPlayer();
  } catch (err) {
    // Fall back to the browser's own controls
    player.classList.remove('is-ui');
    video.controls = true;
    if (window.console) console.error(err);
  }

  function seekTo(t, play) {
    if (api) { api.seek(t); if (play) api.play(); }
    else { video.currentTime = t; if (play) video.play(); }
  }

  function chapterAt(t) {
    var idx = -1;
    for (var i = 0; i < chapters.length; i++) { if (t + 0.25 >= chapters[i].start) idx = i; }
    return idx;
  }

  /* Transcript, read from a WebVTT file */
  if (current.transcript && window.fetch) {
    fetch(current.transcript).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function (text) {
      var cues = parseVtt(text);
      if (!cues.length) return;
      var groups = chapters.length ? chapters.map(function (c) { return { c: c, lines: [] }; }) : [{ c: { start: 0, title: '' }, lines: [] }];
      cues.forEach(function (cue) {
        var gi = chapters.length ? Math.max(0, chapterAt(cue.start)) : 0;
        groups[gi].lines.push(cue.text);
      });
      var host = $('#v-transcript');
      groups.forEach(function (g) {
        if (!g.lines.length) return;
        var sec = document.createElement('section');
        var h = document.createElement('h3');
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'time-link'; b.textContent = fmt(g.c.start);
        b.setAttribute('aria-label', 'Play from ' + spoken(g.c.start));
        b.addEventListener('click', function () { seekTo(g.c.start, true); player.scrollIntoView({ block: 'center', behavior: 'smooth' }); player.focus({ preventScroll: true }); });
        h.appendChild(b);
        if (g.c.title) { var s = document.createElement('span'); s.textContent = g.c.title; h.appendChild(s); }
        var p = document.createElement('p'); p.textContent = g.lines.join(' ');
        sec.appendChild(h); sec.appendChild(p); host.appendChild(sec);
      });
      $('#v-transcript-wrap').hidden = false;
    }).catch(function () { /* transcript is optional */ });
  }

  function parseVtt(text) {
    var out = [];
    text.replace(/\r/g, '').split(/\n{2,}/).forEach(function (block) {
      var lines = block.split('\n');
      var i = -1;
      for (var k = 0; k < lines.length; k++) { if (lines[k].indexOf('-->') !== -1) { i = k; break; } }
      if (i < 0) return;
      var m = /^\s*(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})/.exec(lines[i]);
      if (!m) return;
      var start = (+m[1] || 0) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / 1000;
      var t = lines.slice(i + 1).join(' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (t) out.push({ start: start, text: t });
    });
    return out;
  }

  /* Copy a link to the current point of the video */
  $('#v-copy').addEventListener('click', function () {
    var t = Math.floor(video.currentTime || 0);
    var url = window.location.origin + window.location.pathname + '?v=' + encodeURIComponent(current.id) + (t > 0 ? '&t=' + t : '');
    var done = function () { status('Link copied' + (t > 0 ? ' (starts at ' + fmt(t) + ')' : '') + '.'); };
    var fallback = function () {
      var ta = document.createElement('textarea');
      ta.value = url; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (ok) done(); else status('Copy this link: ' + url);
    };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, fallback);
    else fallback();
  });

  /* ---------------- Custom controls ---------------- */

  function setUpPlayer() {
    var bar = $('.p-bar', player);
    var big = $('.p-big', player);
    var bigLabel = $('.p-big__label', player);
    var range = $('.p-range', player);
    var played = $('.p-played', player);
    var buffered = $('.p-buffered', player);
    var marks = $('.p-marks', player);
    var seekBox = $('.p-seek', player);
    var tip = $('.p-tip', player);
    var playBtn = $('.p-play', player);
    var muteBtn = $('.p-mute', player);
    var vol = $('.p-vol', player);
    var curEl = $('.p-cur', player);
    var durEl = $('.p-dur', player);
    var chapEl = $('.p-chapter', player);
    var speedBtn = $('.p-speed', player);
    var menu = $('.p-menu', player);
    var ccBtn = $('.p-cc', player);
    var pipBtn = $('.p-pip', player);
    var fsBtn = $('.p-fs', player);
    var osd = $('.p-osd', player);
    var resumeBox = $('.p-resume', player);
    var errorBox = $('.p-error', player);

    var key = 'drmd-video-position:' + current.id;
    var duration = 0, dragging = false, lastSave = 0, idleTimer = 0, osdTimer = 0;
    var keyboardMode = false, overBar = false, clickTimer = 0, activeChapter = -2, startAt = parseTime(params.get('t'));

    video.controls = false;
    video.removeAttribute('controls');
    player.classList.add('is-ui');

    function dur() { return duration || video.duration || 0; }

    function play() {
      var p = video.play();
      if (p && p.catch) p.catch(function () { /* playback was blocked; the play button stays visible */ });
    }
    function toggle() { if (video.paused || video.ended) play(); else video.pause(); }
    function seek(t) {
      var d = dur();
      t = Math.max(0, d ? Math.min(t, d - 0.05) : t);
      video.currentTime = t;
      render();
    }
    function nudge(s) { seek((video.currentTime || 0) + s); flash((s > 0 ? '+' : '−') + Math.abs(s) + ' s'); }

    function flash(text) {
      osd.textContent = text;
      osd.classList.add('is-on');
      clearTimeout(osdTimer);
      osdTimer = setTimeout(function () { osd.classList.remove('is-on'); }, 800);
    }

    /* --- Drawing --- */
    function render() {
      var d = dur(), t = video.currentTime || 0;
      var pct = d ? (t / d) * 100 : 0;
      played.style.width = pct + '%';
      if (!dragging) range.value = t;
      range.setAttribute('aria-valuetext', spoken(t) + ' of ' + spoken(d));
      curEl.textContent = fmt(t);
      var ci = chapterAt(t);
      if (ci !== activeChapter) {
        activeChapter = ci;
        chapEl.textContent = ci >= 0 ? chapters[ci].title : '';
        $$('.chapter').forEach(function (b, i) {
          if (i === ci) {
            b.setAttribute('aria-current', 'true');
            var listEl = b.closest('.chapters__list');
            if (listEl && listEl.scrollHeight > listEl.clientHeight) {
              var top = b.offsetTop - listEl.offsetTop;
              if (top < listEl.scrollTop || top + b.offsetHeight > listEl.scrollTop + listEl.clientHeight) {
                listEl.scrollTop = Math.max(0, top - listEl.clientHeight / 3);
              }
            }
          } else {
            b.removeAttribute('aria-current');
          }
        });
      }
    }

    function renderBuffered() {
      var d = dur(), t = video.currentTime || 0, end = 0;
      for (var i = 0; i < video.buffered.length; i++) {
        if (video.buffered.start(i) <= t + 0.5) end = Math.max(end, video.buffered.end(i));
      }
      buffered.style.width = d ? Math.min(100, (end / d) * 100) + '%' : '0';
    }

    function drawMarks() {
      marks.innerHTML = '';
      var d = dur();
      if (!d) return;
      chapters.forEach(function (c, i) {
        if (i === 0 || c.start <= 0 || c.start >= d) return;
        var m = document.createElement('span');
        m.className = 'p-mark';
        m.style.left = (c.start / d) * 100 + '%';
        marks.appendChild(m);
      });
    }

    function setDuration(d) {
      if (!d || !isFinite(d)) return;
      duration = d;
      range.max = d;
      durEl.textContent = fmt(d);
      drawMarks();
      render();
    }

    /* --- Controls visibility --- */
    function show() {
      player.classList.remove('is-idle');
      clearTimeout(idleTimer);
      if (!video.paused) idleTimer = setTimeout(hideIfIdle, 2600);
    }
    function hideIfIdle() {
      if (!player.classList.contains('is-fullscreen')) return;
      if (video.paused || !menu.hidden || overBar) return;
      if (keyboardMode && bar.contains(document.activeElement)) return;
      player.classList.add('is-idle');
    }

    /* --- Video events --- */
    var metaDone = false;
    function onMeta() {
      if (metaDone) return;
      metaDone = true;
      setDuration(video.duration);
      if (startAt !== null) {
        seek(startAt);
        startAt = null;
      } else {
        var saved = parseFloat(store.get(key));
        if (saved > 15 && saved < dur() - 15) {
          $('.p-resume__go', resumeBox).textContent = 'Resume from ' + fmt(saved);
          $('.p-resume__go', resumeBox).onclick = function () { resumeBox.hidden = true; seek(saved); play(); };
          $('.p-resume__x', resumeBox).onclick = function () { resumeBox.hidden = true; store.del(key); seek(0); };
          resumeBox.hidden = false;
        }
      }
    }
    video.addEventListener('loadedmetadata', onMeta);
    video.addEventListener('durationchange', function () { setDuration(video.duration); });
    video.addEventListener('timeupdate', function () {
      render();
      var t = video.currentTime;
      if (Math.abs(t - lastSave) > 4) { lastSave = t; if (t > 5) store.set(key, t.toFixed(1)); }
    });
    video.addEventListener('progress', renderBuffered);
    video.addEventListener('play', function () {
      player.classList.add('is-playing');
      playBtn.setAttribute('aria-label', 'Pause (k)');
      resumeBox.hidden = true;
      show();
    });
    video.addEventListener('pause', function () {
      player.classList.remove('is-playing');
      playBtn.setAttribute('aria-label', 'Play (k)');
      bigLabel.textContent = 'Play video';
      if (video.currentTime > 5 && !video.ended) store.set(key, video.currentTime.toFixed(1));
      show();
    });
    video.addEventListener('ended', function () {
      player.classList.remove('is-playing');
      bigLabel.textContent = 'Play again';
      store.del(key);
      show();
    });
    video.addEventListener('waiting', function () { player.classList.add('is-waiting'); });
    ['playing', 'canplay', 'seeked', 'pause'].forEach(function (ev) {
      video.addEventListener(ev, function () { player.classList.remove('is-waiting'); renderBuffered(); });
    });
    video.addEventListener('volumechange', function () {
      var muted = video.muted || video.volume === 0;
      player.classList.toggle('is-muted', muted);
      muteBtn.setAttribute('aria-label', muted ? 'Turn sound on (m)' : 'Mute (m)');
      vol.value = muted ? 0 : video.volume;
      vol.style.setProperty('--v', (muted ? 0 : video.volume * 100) + '%');
      vol.setAttribute('aria-valuetext', muted ? 'Muted' : Math.round(video.volume * 100) + '%');
      store.set('drmd-video-volume', video.volume.toFixed(2));
      store.set('drmd-video-muted', video.muted ? '1' : '0');
    });
    video.addEventListener('ratechange', function () {
      var r = video.playbackRate;
      speedBtn.textContent = String(r).replace(/\.0+$/, '') + '×';
      speedBtn.setAttribute('aria-label', 'Playback speed: ' + speedLabel(r).toLowerCase());
      $$('button', menu).forEach(function (b) { b.setAttribute('aria-checked', Number(b.dataset.rate) === r ? 'true' : 'false'); });
    });
    video.addEventListener('error', function () {
      if (video.error) { errorBox.hidden = false; player.classList.remove('is-waiting'); }
    });

    /* --- Seek bar --- */
    range.addEventListener('input', function () {
      dragging = true;
      seekBox.classList.add('is-active');
      video.currentTime = Number(range.value);
      render();
    });
    range.addEventListener('change', function () {
      dragging = false;
      seekBox.classList.remove('is-active');
      render();
    });
    range.addEventListener('keydown', function (e) {
      var d = dur(), t = video.currentTime || 0, handled = true;
      switch (e.key) {
        case 'ArrowLeft': case 'ArrowDown': seek(t - 5); break;
        case 'ArrowRight': case 'ArrowUp': seek(t + 5); break;
        case 'PageDown': seek(t - 60); break;
        case 'PageUp': seek(t + 60); break;
        case 'Home': seek(0); break;
        case 'End': seek(d); break;
        default: handled = false;
      }
      if (handled) { e.preventDefault(); e.stopPropagation(); show(); }
    });
    seekBox.addEventListener('pointermove', function (e) {
      var d = dur();
      if (!d) return;
      var r = seekBox.getBoundingClientRect();
      var x = Math.max(0, Math.min(r.width, e.clientX - r.left));
      var t = (x / r.width) * d;
      var ci = chapterAt(t);
      $('strong', tip).textContent = fmt(t);
      $('span', tip).textContent = ci >= 0 ? chapters[ci].title : '';
      var half = tip.offsetWidth / 2;
      tip.style.left = Math.max(half, Math.min(r.width - half, x)) + 'px';
    });

    /* --- Buttons --- */
    $$('[data-act="toggle"]', player).forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); toggle(); }); });
    $('[data-act="back"]', player).addEventListener('click', function () { nudge(-10); });
    $('[data-act="forward"]', player).addEventListener('click', function () { nudge(10); });

    function toggleMute() {
      if (video.muted || video.volume === 0) {
        video.muted = false;
        if (video.volume === 0) video.volume = 0.5;
      } else {
        video.muted = true;
      }
    }
    muteBtn.addEventListener('click', toggleMute);
    vol.addEventListener('input', function () {
      var v = Number(vol.value);
      video.volume = v;
      video.muted = v === 0;
    });
    function changeVolume(delta) {
      video.muted = false;
      video.volume = Math.max(0, Math.min(1, Math.round((video.volume + delta) * 20) / 20));
      flash('Volume ' + Math.round(video.volume * 100) + '%');
    }

    // Playback speed menu
    var mt = document.createElement('div');
    mt.className = 'p-menu__title'; mt.textContent = 'Playback speed'; mt.setAttribute('aria-hidden', 'true');
    menu.appendChild(mt);
    SPEEDS.forEach(function (r) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('role', 'menuitemradio');
      b.setAttribute('aria-checked', r === 1 ? 'true' : 'false');
      b.dataset.rate = r;
      b.tabIndex = -1;
      b.textContent = speedLabel(r);
      b.addEventListener('click', function () { setRate(r); closeMenu(true); });
      menu.appendChild(b);
    });
    function setRate(r) {
      video.playbackRate = r;
      store.set('drmd-video-speed', r);
      flash(speedLabel(r) === 'Normal' ? 'Normal speed' : speedLabel(r));
    }
    function stepRate(dir) {
      var i = SPEEDS.indexOf(video.playbackRate);
      if (i < 0) i = 1;
      setRate(SPEEDS[Math.max(0, Math.min(SPEEDS.length - 1, i + dir))]);
    }
    function openMenu() {
      menu.hidden = false;
      speedBtn.setAttribute('aria-expanded', 'true');
      show();
      var items = $$('button', menu);
      var sel = items.filter(function (b) { return b.getAttribute('aria-checked') === 'true'; })[0] || items[0];
      sel.focus();
    }
    function closeMenu(focusButton) {
      if (menu.hidden) return;
      menu.hidden = true;
      speedBtn.setAttribute('aria-expanded', 'false');
      if (focusButton) speedBtn.focus();
    }
    speedBtn.addEventListener('click', function (e) { e.stopPropagation(); if (menu.hidden) openMenu(); else closeMenu(true); });
    menu.addEventListener('keydown', function (e) {
      var items = $$('button', menu), i = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
      else if (e.key === 'Home') { e.preventDefault(); items[0].focus(); }
      else if (e.key === 'End') { e.preventDefault(); items[items.length - 1].focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); closeMenu(true); }
      else if (e.key === 'Tab') { closeMenu(false); }
      e.stopPropagation();
    });
    document.addEventListener('click', function (e) { if (!menu.hidden && !menu.contains(e.target) && e.target !== speedBtn) closeMenu(false); });

    // Captions (only when a captions file is given)
    var tt = video.textTracks && video.textTracks.length ? video.textTracks[0] : null;
    function setCaptions(on) {
      if (!tt) return;
      tt.mode = on ? 'showing' : 'hidden';
      ccBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
      store.set('drmd-video-captions', on ? '1' : '0');
    }
    if (tt) {
      ccBtn.hidden = false;
      setCaptions(store.get('drmd-video-captions') !== '0');
      ccBtn.addEventListener('click', function () { setCaptions(tt.mode !== 'showing'); });
    }

    // Picture-in-picture: the video keeps playing in a small window
    var pipOK = !!(document.pictureInPictureEnabled && !video.disablePictureInPicture && video.requestPictureInPicture);
    function togglePip() {
      if (!pipOK) return;
      if (document.pictureInPictureElement) document.exitPictureInPicture().catch(function () {});
      else video.requestPictureInPicture().catch(function () { status('Picture-in-picture is not available right now.'); });
    }
    if (pipOK) {
      pipBtn.hidden = false;
      pipBtn.addEventListener('click', togglePip);
      video.addEventListener('enterpictureinpicture', function () {
        pipBtn.setAttribute('aria-pressed', 'true');
        pipBtn.setAttribute('aria-label', 'Back to the page (i)');
        status('The video is playing in a small window.');
      });
      video.addEventListener('leavepictureinpicture', function () {
        pipBtn.setAttribute('aria-pressed', 'false');
        pipBtn.setAttribute('aria-label', 'Picture-in-picture: play in a small window (i)');
      });
    }

    // Full screen
    function fsElement() { return document.fullscreenElement || document.webkitFullscreenElement || null; }
    var fsOK = !!(player.requestFullscreen || player.webkitRequestFullscreen || video.webkitEnterFullscreen);
    function toggleFs() {
      if (fsElement()) {
        (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else if (player.requestFullscreen) {
        var p = player.requestFullscreen({ navigationUI: 'hide' });
        if (p && p.catch) p.catch(function () {});
      } else if (player.webkitRequestFullscreen) {
        player.webkitRequestFullscreen();
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen();
      }
    }
    function onFs() {
      var on = fsElement() === player;
      player.classList.toggle('is-fullscreen', on);
      fsBtn.setAttribute('aria-label', on ? 'Exit full screen (f)' : 'Full screen (f)');
      show();
    }
    if (fsOK) {
      fsBtn.addEventListener('click', toggleFs);
      document.addEventListener('fullscreenchange', onFs);
      document.addEventListener('webkitfullscreenchange', onFs);
    } else {
      fsBtn.hidden = true;
    }

    /* --- Pointer and keyboard --- */
    video.addEventListener('click', function (e) {
      if (e.pointerType === 'touch' && player.classList.contains('is-idle')) { show(); return; }
      clearTimeout(clickTimer);
      clickTimer = setTimeout(toggle, 200);
    });
    video.addEventListener('dblclick', function () {
      clearTimeout(clickTimer);
      if (fsOK) toggleFs();
    });
    player.addEventListener('pointermove', function () { show(); });
    player.addEventListener('pointerdown', function () { keyboardMode = false; show(); });
    player.addEventListener('pointerleave', function () {
      if (!video.paused) { clearTimeout(idleTimer); idleTimer = setTimeout(hideIfIdle, 900); }
    });
    bar.addEventListener('pointerenter', function () { overBar = true; });
    bar.addEventListener('pointerleave', function () { overBar = false; });
    player.addEventListener('focusin', function () { if (keyboardMode) show(); });

    player.addEventListener('keydown', function (e) {
      keyboardMode = true;
      show();
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      var target = e.target;
      var isRange = target.tagName === 'INPUT' && target.type === 'range';
      var isButton = target.tagName === 'BUTTON' || target.tagName === 'A';
      if (menu.contains(target)) return;
      var k = e.key, handled = true;
      if (k === ' ' || k === 'Spacebar') { if (isButton) return; toggle(); }
      else if (k === 'k' || k === 'K') toggle();
      else if (k === 'ArrowLeft') { if (isRange) return; nudge(-5); }
      else if (k === 'ArrowRight') { if (isRange) return; nudge(5); }
      else if (k === 'j' || k === 'J') nudge(-10);
      else if (k === 'l' || k === 'L') nudge(10);
      else if (k === 'ArrowUp') { if (isRange) return; changeVolume(0.05); }
      else if (k === 'ArrowDown') { if (isRange) return; changeVolume(-0.05); }
      else if (k === 'm' || k === 'M') { toggleMute(); flash(video.muted ? 'Sound off' : 'Sound on'); }
      else if (k === 'f' || k === 'F') { if (fsOK) toggleFs(); }
      else if (k === 'i' || k === 'I') togglePip();
      else if ((k === 'c' || k === 'C') && tt) setCaptions(tt.mode !== 'showing');
      else if (k === '<') stepRate(-1);
      else if (k === '>') stepRate(1);
      else if (k === 'Home') { if (isRange) return; seek(0); }
      else if (k === 'End') { if (isRange) return; seek(dur()); }
      else if (/^[0-9]$/.test(k)) seek(dur() * Number(k) / 10);
      else handled = false;
      if (handled) e.preventDefault();
    });

    /* --- Restore preferences --- */
    var v = parseFloat(store.get('drmd-video-volume'));
    if (v >= 0 && v <= 1) video.volume = v;
    if (store.get('drmd-video-muted') === '1') video.muted = true;
    var r = parseFloat(store.get('drmd-video-speed'));
    if (SPEEDS.indexOf(r) >= 0) video.playbackRate = r;
    video.dispatchEvent(new Event('volumechange'));
    video.dispatchEvent(new Event('ratechange'));

    // Show the chapter marks before the file's own information has loaded
    var known = parseTime(current.duration);
    if (known) { duration = known; range.max = known; durEl.textContent = fmt(known); drawMarks(); }
    if (video.readyState >= 1) onMeta();
    render();

    return { seek: seek, play: play };
  }
})();
