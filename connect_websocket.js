require('dotenv').config();
// require('dotenv').config({ path: '.envDev' });
const WebSocket = require('ws');

let accessToken = null;
let heartbeatInterval = null;

// Check if required environment variables are defined
const requiredEnvVars = ['SUBSCRIPTION_ID', 'WS_URL', 'CLIENT_USERNAME', 'CLIENT_PASSWORD', 'OAUTH_URL'];
requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
        throw new Error(`Environment variable ${envVar} is required but not defined.`);
    }
});

// Fetch access token
async function getAccessToken() {
    const username = process.env.CLIENT_USERNAME;
    const password = process.env.CLIENT_PASSWORD;
    const url = `${process.env.OAUTH_URL}?grant_type=client_credentials`; // OAuth token URL

    const headers = {
        "Authorization": `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`, // Base64 encoded credentials
        "Content-Type": "application/x-www-form-urlencoded" // Content type for POST request
    };

    try {
        // Send a POST request to fetch the access token
        const response = await fetch(url, {
            method: "POST",
            headers: headers,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(`Failed to fetch access token: ${JSON.stringify(data)}`);
        }

        accessToken = data.access_token; // Store the access token
        console.log(`Successfully fetched a new access token.`);
        return accessToken;
    } catch (error) {
        console.error("Error fetching access token:", error);
        throw error;
    }
}

// Create WebSocket connection
async function createWebSocket(currentWsUrl) {
    let socket;
    const maxRetries = 5;
    let retries = 0;

    while (retries < maxRetries) {
        try {
            // Fetch a fresh access token before each attempt
            const token = await getAccessToken();
            console.log(`Attempting to connect to WebSocket: ${currentWsUrl}`);
            socket = new WebSocket(`${currentWsUrl}&access_token=${token}`);

            // Add event listeners for WebSocket
            addWebSocketListeners(socket);
             // Return the WebSocket instance if successful
            return socket;
        } catch (error) {
            console.error(`WebSocket connection failed. Retry ${retries + 1}/${maxRetries}`);
            retries++;
            await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3 seconds before retrying
        }
    }

    throw new Error('Failed to connect to WebSocket after maximum retries.');
}

// Add event listeners to WebSocket
function addWebSocketListeners(socket) {
    socket.addEventListener('open', () => {
        console.log('WebSocket connection opened.');
        startHeartbeat(socket);
    });

    socket.addEventListener('message', (event) => {
        console.log('Message received from WebSocket:', event.data);
    });

    socket.addEventListener('close', (event) => {
        console.warn('WebSocket connection closed:', event.reason);
        stopHeartbeat();
    });

    socket.addEventListener('error', (error) => {
        console.error('WebSocket error:', error);
        stopHeartbeat();
    });
}

// Start the heartbeat mechanism
function startHeartbeat(socket) {
    const heartbeatMessage = JSON.stringify({ "module":"heartbeat" });
    const heartbeatIntervalMs = 30000; // Heartbeat every 30 seconds

    heartbeatInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(heartbeatMessage);
            console.log('Heartbeat sent.');
        }
    }, heartbeatIntervalMs);
}

// Stop the heartbeat mechanism
function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
        console.log('Heartbeat stopped.');
    }
}

// Connect to WebSocket
async function connectWebSocket() {
    const subscriptionId = process.env.SUBSCRIPTION_ID;
    const primaryWsUrl = `${process.env.WS_URL}?subscriptionId=${subscriptionId}`;
    let socket;

    try {
        socket = await createWebSocket(primaryWsUrl);
        return socket;
    } catch (error) {
        console.error('Error connecting WebSocket:', error);
        throw error;
    }
}

module.exports = { connectWebSocket };

// Example invocation
if (require.main === module) {
    (async () => {
        try {
            await connectWebSocket();
        } catch (error) {
            console.error("Error:", error);
        }
    })();
}
