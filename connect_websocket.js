require('dotenv').config(); // Load environment variables from .env file

let cachedAccessToken = null; // Cache for the access_token
let tokenExpiryTime = 0; // Expiry time for the access_token (timestamp)

function connectWebSocket() {
    const subscriptionId = process.env.SUBSCRIPTION_ID;
    const primaryWsUrl = `wss://ws.zoom.us/ws?subscriptionId=${subscriptionId}`;
    const backupWsUrl = `wss://backupws.us/ws?subscriptionId=${subscriptionId}`;
    let currentWsUrl = primaryWsUrl;
    let socket;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10; // Maximum number of reconnection attempts
    const reconnectInterval = 3000; // Interval between reconnection attempts (in milliseconds)

    async function getAccessToken() {
        // Check if the cached token is still valid
        if (cachedAccessToken && Date.now() < tokenExpiryTime) {
            console.log("Using cached access token.");
            return cachedAccessToken;
        }

        const accountId = process.env.ACCOUNT_ID;
        const username = process.env.CLIENT_USERNAME;
        const password = process.env.CLIENT_PASSWORD;

        const url = `https://zoom.us/oauth/token?grant_type=client_credentials&account_id=${accountId}`;
        const headers = {
            "Authorization": `Basic ${btoa(`${username}:${password}`)}`, // Base64 encoding
            "Content-Type": "application/x-www-form-urlencoded"
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: headers,
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch access token: ${response.statusText}`);
            }

            const data = await response.json();
            cachedAccessToken = data.access_token;
            tokenExpiryTime = Date.now() + (data.expires_in * 1000) - 60000;
            console.log(`Fetched new access token. Expires in ${data.expires_in} seconds.`);
            return cachedAccessToken;
        } catch (error) {
            console.error("Error fetching access token:", error);
            throw error;
        }
    }

    async function createWebSocket() {
        try {
            const accessToken = await getAccessToken();
            console.log(`Attempting to connect to WebSocket: ${currentWsUrl}`);
            socket = new WebSocket(`${currentWsUrl}&access_token=${accessToken}`);

            socket.addEventListener('open', () => {
                console.log('WebSocket connection opened.');
                reconnectAttempts = 0; // Reset reconnection attempts on successful connection
            });

            socket.addEventListener('message', (event) => {
                console.log('Message received from WebSocket:', event.data);
            });

            socket.addEventListener('close', async (event) => {
                console.warn('WebSocket connection closed:', event.reason);

                // Try reconnecting
                if (event.reason === "invalid_token") {
                    console.log("Invalid token detected. Fetching a new token...");
                    cachedAccessToken = null;
                    await getAccessToken();
                    await createWebSocket();
                } else {
                    await attemptReconnect();
                }
            });

            socket.addEventListener('error', (error) => {
                console.error('WebSocket error:', error);
                socket.close();
            });
        } catch (error) {
            console.error("Error creating WebSocket:", error);
            await attemptReconnect();
        }
    }

    async function attemptReconnect() {
        reconnectAttempts++;
        if (reconnectAttempts <= maxReconnectAttempts) {
            console.log(`Reconnecting WebSocket... (${reconnectAttempts}/${maxReconnectAttempts})`);
            setTimeout(createWebSocket, reconnectInterval); // Retry after a delay
        } else {
            console.warn('Maximum reconnect attempts reached. Switching to backup WebSocket URL.');
            switchToBackupUrl();
        }
    }

    function switchToBackupUrl() {
        if (currentWsUrl === primaryWsUrl) {
            currentWsUrl = backupWsUrl;
            console.log('Switched to backup WebSocket URL.');
            reconnectAttempts = 0; // Reset reconnection attempts when switching to backup URL
            createWebSocket();
        } else {
            console.error('Both primary and backup WebSocket URLs failed. Giving up.');
        }
    }

    createWebSocket();
}

// Example invocation
(async () => {
    try {
        connectWebSocket();
    } catch (error) {
        console.error("Error:", error);
    }
})();
