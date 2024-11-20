require('dotenv').config();

let accessToken = null;
let heartbeatInterval = null;

function connectWebSocket() {
    const subscriptionId = process.env.SUBSCRIPTION_ID;
    const primaryWsUrl = `wss://ws.zoom.us/ws?subscriptionId=${subscriptionId}`;
    let currentWsUrl = primaryWsUrl;
    let socket;

    // Fetch access token from Zoom
    async function getAccessToken() {
        const username = process.env.CLIENT_USERNAME;
        const password = process.env.CLIENT_PASSWORD;
        const url = `https://zoom.us/oauth/token?grant_type=client_credentials`;
        const headers = {
            "Authorization": `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
            "Content-Type": "application/x-www-form-urlencoded"
        };

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: headers,
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(`Failed to fetch access token: ${JSON.stringify(data)}`);
            }

            accessToken = data.access_token;
            console.log(`Fetched new access token.`);
            return accessToken;
        } catch (error) {
            console.error("Error fetching access token:", error);
            throw error;
        }
    }

    // Create WebSocket connection
    async function createWebSocket() {
        try {
            // Fetch access token before connecting
            const accessToken = await getAccessToken();
            console.log(`Attempting to connect to WebSocket: ${currentWsUrl}`);
            socket = new WebSocket(`${currentWsUrl}&access_token=${accessToken}`);

            socket.addEventListener('open', () => {
                console.log('WebSocket connection opened.');
                startHeartbeat();
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
        } catch (error) {
            console.error("Error creating WebSocket:", error);
        }
    }

    function startHeartbeat() {
        const heartbeatMessage = JSON.stringify({ module: 'heartbeat' });
        // Heartbeat interval, 30 seconds
        const heartbeatIntervalMs = 30000;

        heartbeatInterval = setInterval(() => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(heartbeatMessage);
                console.log('Heartbeat sent.');
            }
        }, heartbeatIntervalMs);
    }

    function stopHeartbeat() {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
            console.log('Heartbeat stopped.');
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
