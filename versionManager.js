const fs = require('fs');
const path = require('path');

// Function to manage and check bot version
function startVersionManager() {
  const versionFilePath = path.join(__dirname, 'data', 'version.json'); // Path to version file

  // Check if the version file exists
  if (fs.existsSync(versionFilePath)) {
    const versionData = JSON.parse(fs.readFileSync(versionFilePath, 'utf-8'));
    console.log(`Bot version: ${versionData.version}`);
  } else {
    console.log("Version file does not exist. Creating a new version file...");

    // Default version data
    const defaultVersionData = { version: "1.0.0" };
    fs.writeFileSync(versionFilePath, JSON.stringify(defaultVersionData, null, 2));

    console.log("Version file created with version 1.0.0");
  }
}

// Export the function to be used in other files
module.exports = { startVersionManager };
