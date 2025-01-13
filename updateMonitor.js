const fs = require('fs');
const chokidar = require('chokidar');

// Declare fetch outside the async function
let fetch;

// Function to read and parse the version file
function readVersionFile() {
    const rawData = fs.readFileSync('./version.json', 'utf8');
    return JSON.parse(rawData);
}

// Function to send a webhook update
async function sendWebhookUpdate(webhookURL, version, changelog, color = 0x00ff00) {
    if (!fetch) {
        console.error("[Error] fetch is not initialized");
        return;
    }

    const payload = {
        content: `## <a:announce:1315349130272575580> Blaze is now updated to version __\`${version}\`__!\n <@&1314824792192454737>`,
        embeds: [
            {
                description: `## > <:update:1315345080264953856> Update Summary\n${changelog.map(line => `- ${line}`).join('\n')}`,
                color: color,
                timestamp: new Date().toISOString(),
                footer: {
                    text: `Blaze Changelog`,
                },
            },
        ],
    };

    try {
        const response = await fetch(webhookURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error(`Webhook Error: ${response.statusText}`);
        }

        console.log(`[Webhook] Successfully sent update v${version}`);
    } catch (error) {
        console.error(`[Webhook Error] Failed to send update: ${error.message}`);
        sendErrorNotification(webhookURL, error.message);
    }
}

// Function to send error notifications
async function sendErrorNotification(webhookURL, errorMessage) {
    if (!fetch) {
        console.error("[Error] fetch is not initialized");
        return;
    }

    const payload = {
        embeds: [
            {
                title: `⚠️ Webhook Error`,
                description: `An error occurred while posting the changelog:\n\`\`\`${errorMessage}\`\`\``,
                color: 0xff0000,
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'Blaze Bot Error Notification',
                },
            },
        ],
    };

    try {
        const response = await fetch(webhookURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            console.error(`[Error Notification] Failed to notify: ${response.statusText}`);
        } else {
            console.log('[Error Notification] Error message sent successfully.');
        }
    } catch (error) {
        console.error(`[Error Notification] Failed to send error notification: ${error.message}`);
    }
}

// Monitor the version file for changes
function startVersionMonitor(webhookURL) {
    let lastVersion = null;

    chokidar.watch('./version.json').on('change', () => {
        console.log('[Monitor] Detected changes in version.json');
        const { version, changelog } = readVersionFile();

        if (lastVersion !== version) {
            lastVersion = version; // Update the cached version
            sendWebhookUpdate(webhookURL, version, changelog);
        }
    });

    console.log('[Monitor] Watching for changes in version.json...');
}

// Scheduled update checks (runs once a day)
function scheduleUpdateCheck(webhookURL) {
    const oneDayInMs = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    setInterval(() => {
        console.log('[Scheduler] Checking for updates...');
        const { version, changelog } = readVersionFile();

        // Only send the webhook if the version has actually changed
        sendWebhookUpdate(webhookURL, version, changelog);
    }, oneDayInMs); // Run the check once every 24 hours

    console.log('[Scheduler] Scheduled update checks once a day.');
}

// Export functions and initialize fetch asynchronously
module.exports = {
    startVersionMonitor,
    scheduleUpdateCheck,
    initialize: async () => {
        try {
            // Dynamically import node-fetch only once during initialization
            const module = await import('node-fetch');
            fetch = module.default; // Assign the default export of node-fetch
            console.log('[Initialization] fetch initialized.');
        } catch (error) {
            console.error('[Initialization Error]', error);
        }
    }
};
