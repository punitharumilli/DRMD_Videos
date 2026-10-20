/*
  List of the videos shown on this site. The first entry opens when the page is loaded.

  To add a video:
    1. Create a folder for it under videos/, for example videos/drmd-schema/,
       and put the MP4 file and a poster picture (JPG, 16:9) in it.
    2. Copy the entry below, paste it as a new entry in the list, and change the values.
       A comma separates two entries.
    3. Push the change. The video appears on the site about a minute later.

  Fields:
    id            short name used in links, for example ?v=drmd-schema
    title         title shown above the description
    description   one or two sentences about the video
    file          path to the MP4 file
    poster        path to the picture shown before the video starts (optional)
    duration      length as shown on the page, for example "12:32"
    size          file size shown on the download button, for example "30 MB"
    language      spoken language
    captionsInVideo  true if the captions are part of the picture
    captions      path to a WebVTT captions file, shown with the CC button (optional)
    transcript    path to a WebVTT file used for the transcript (optional)
    chapters      list of [start in seconds, "chapter title"] (optional)
*/
window.DRMD_VIDEOS = [
  {
    id: "drmd-ai-generator",
    title: "How to use the DRMD AI Generator",
    description: "The complete workflow with a real certificate: entering the API key, converting a PDF, reviewing every section of the form against the certificate, checking units and identifiers, validating and exporting the DRMD, converting a whole folder and importing an existing XML file.",
    file: "videos/drmd-ai-generator/DRMD-AI-Generator-Video-Guide.mp4",
    poster: "videos/drmd-ai-generator/poster.jpg",
    duration: "12:32",
    size: "30 MB",
    language: "English",
    captionsInVideo: true,
    transcript: "videos/drmd-ai-generator/transcript.vtt",
    chapters: [
      [0, "Introduction"],
      [20, "Getting started"],
      [52, "Settings and API key"],
      [87, "Converting a certificate"],
      [162, "Administrative data"],
      [304, "Materials"],
      [332, "Properties"],
      [456, "Checking values"],
      [504, "Statements"],
      [525, "Comment and documents"],
      [551, "Validate and export"],
      [639, "Converting a folder"],
      [722, "Importing an XML file"],
      [735, "Summary"]
    ]
  }
];
