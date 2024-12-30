// Import required packages
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { exec } = require("child_process");

// Helper function to create directories
const createFolder = (folderPath) => {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
};

// Function to download video
const downloadVideo = async (url, folderPath, fileName) => {
  try {
    console.log(`Downloading: ${url}`);
    const outputFilePath = path.join(folderPath, `${fileName}.mp4`);
    await new Promise((resolve, reject) => {
      exec(
        `yt-dlp -o "${outputFilePath}" "${url}"`,
        (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            console.log(stdout);
            resolve();
          }
        }
      );
    });
    console.log(`Downloaded: ${fileName}\n`);
    console.log("-------------------------------------------\n");
  } catch (error) {
    console.error(`Failed to download ${fileName}:`, error.message);
  }
};

// Function to process Google Drive link
const processGoogleLink = async (googleLink) => {
  try {
    const docId = googleLink.match(/[-\w]{25,}/);
    if (!docId) {
      console.error("Invalid Google Docs link.");
      return;
    }

    const response = await axios.get(
      `https://docs.google.com/document/d/${docId[0]}/export?format=txt`
    );

    const content = response.data;
    const links = [];
    const lines = content.split("\n").filter((line) => line.trim() !== "");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const nextLine = lines[i + 1] ? lines[i + 1].trim() : null;

      if (
        nextLine &&
        (nextLine.includes("tiktok.com") || nextLine.includes("instagram.com"))
      ) {
        links.push({ text: line, link: nextLine });
        i++; // Skip the next line as it has been processed
      }
    }

    if (links.length === 0) {
      console.log("No valid TikTok or Instagram links found.");
      return;
    }

    // Create a folder with the current date inside the "export" folder
    const exportFolder = "export";

    createFolder(exportFolder);

    let datedFolderPath;

    const subfolders = [
      "1 Export",
      "2 Project",
      "3 Audio",
      // "4 Video",
      "5 Text",
      "6 Assets",
    ];

    // Process each link
    for (const { link, text } of links) {
      const today = new Date().toISOString().split("T")[0];

      // const safeText = text.replace(/[^a-zA-Z0-9-_]/g, "_"); // Sanitize folder name
      const safeText = text;

      datedFolderPath = path.join(exportFolder, `${today} ${safeText}`);
      createFolder(datedFolderPath);

      const videoFolder = path.join(datedFolderPath, "4 Video");
      createFolder(videoFolder);

      subfolders.forEach((subfolder) => {
        createFolder(path.join(datedFolderPath, subfolder));
      });

      await downloadVideo(link, videoFolder, `${safeText} (OG)`);
    }

    console.log("All downloads complete!");
  } catch (error) {
    console.error("Error processing Google Link:", error.message);
  }
};

// Example usage
const googleLink =
  "https://docs.google.com/document/d/12ezurwRTesZ9HLNd1WGVgvriM1kZgsRlseqLdRfQkdI/"; // Replace with the actual Google Drive link
processGoogleLink(googleLink);
