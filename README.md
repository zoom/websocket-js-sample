
# WebSocket Demo with Zoom Integration

This repository demonstrates how to integrate with Zoom's WebSocket API, including OAuth token fetching and WebSocket connection management. It includes a heartbeat mechanism to keep WebSocket connections alive and provides a reference implementation for interacting with Zoom's WebSocket-based services.

## Features

- Fetches Zoom OAuth access tokens using the client credentials grant type.
- Establishes a WebSocket connection with Zoom servers.
- Implements a heartbeat mechanism to maintain the WebSocket connection.
- Handles WebSocket events, including `open`, `message`, `close`, and `error`.

## Prerequisites

Before running the project, ensure you have the following:

1. **Node.js**: Version 18.0.0 or higher for built-in fetch API support.
2. **Zoom Account**: Create a server-to-server OAuth or general app on the [Zoom Marketplace](https://marketplace.zoom.us/) to get your client ID and client secret.
3. **Environment Variables**: Set up a `.env` file for your credentials.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/zoom/websocket-js-sample.git
   cd websocket-js-sample
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following keys:
   ```plaintext
   CLIENT_USERNAME=your_client_id
   CLIENT_PASSWORD=your_client_secret
   SUBSCRIPTION_ID=your_subscription_id

   OAUTH_URL=https://zoom.us/oauth/token
   WS_URL=wss://ws.zoom.us/ws
   ```

4. Run the application:
   ```bash
   node connect_websocket.js
   ```

## File Structure

- **`connect_websocket.js`**: Core implementation file.
  - Fetches OAuth tokens from Zoom.
  - Establishes a WebSocket connection.
  - Sends periodic heartbeat messages.
  - Handles WebSocket events such as `open`, `message`, `close`, and `error`.

## How It Works

### Environment Variables Validation

The application validates required environment variables on startup:
```javascript
const requiredEnvVars = ['SUBSCRIPTION_ID', 'WS_URL', 'CLIENT_USERNAME', 'CLIENT_PASSWORD', 'OAUTH_URL'];
requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
        throw new Error(`Environment variable ${envVar} is required but not defined.`);
    }
});
```

### Access Token Fetching

Access tokens are fetched from Zoom's API using the client credentials grant type:

```javascript
const url = `${process.env.OAUTH_URL}?grant_type=client_credentials`;
const headers = {
    "Authorization": `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    "Content-Type": "application/x-www-form-urlencoded"
};
const response = await fetch(url, {
    method: "POST",
    headers: headers,
});
```

### WebSocket Heartbeat

A heartbeat mechanism ensures the connection remains active. Heartbeat messages are sent every 30 seconds:

```javascript
function startHeartbeat() {
    const heartbeatMessage = JSON.stringify({ module: 'heartbeat' });
    const heartbeatIntervalMs = 30000;

    heartbeatInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(heartbeatMessage);
            console.log('Heartbeat sent.');
        }
    }, heartbeatIntervalMs);
}
```

### WebSocket Connection

The WebSocket URL is constructed using the subscription ID and access token:
```javascript
const subscriptionId = process.env.SUBSCRIPTION_ID;
const primaryWsUrl = `${process.env.WS_URL}?subscriptionId=${subscriptionId}`;
socket = new WebSocket(`${primaryWsUrl}&access_token=${token}`);
```

The application implements a retry mechanism for WebSocket connections:
- Maximum 5 retry attempts
- 3-second delay between retries
- Fresh access token for each attempt

### WebSocket Event Handling

The application listens for key WebSocket events:

- **`open`**: Starts the heartbeat mechanism.
- **`message`**: Logs incoming messages.
- **`close`**: Stops the heartbeat mechanism and logs closure.
- **`error`**: Logs errors and stops the heartbeat mechanism.

## Example

Start the application to connect to Zoom's WebSocket server. Messages and events are logged to the console.

```bash
node connect_websocket.js
```

## Notes

- Ensure your Zoom server-to-server OAuth or general app is properly configured in the Zoom Marketplace.
- For production use, consider implementing a token refresh mechanism and secure credential storage.
- The following environment variables are fixed Zoom endpoints and can be used directly:
  ```
  OAUTH_URL=https://zoom.us/oauth/token    # Zoom OAuth token endpoint
  WS_URL=wss://ws.zoom.us/ws              # Zoom WebSocket endpoint
  ```

## Resources

- [Zoom OAuth Documentation](https://marketplace.zoom.us/docs/guides/auth/oauth)
- [Zoom WebSocket API Documentation](https://developers.zoom.us/docs/api/rest/websockets/)
