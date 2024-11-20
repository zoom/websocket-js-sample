
# WebSocket Demo

This project is a simple demonstration of WebSocket implementation using Node.js and JavaScript. It showcases how to establish a WebSocket connection, handle messages, and manage connection events.

## Prerequisites

Ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (version 14 or higher)
- [npm](https://www.npmjs.com/) (Node.js package manager)

## Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/eziosudo/websocket_demo.git
   ```

2. **Navigate to the project directory**:

   ```bash
   cd websocket_demo
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

## Usage

1. **Start the WebSocket server**:

   ```bash
   node connect_websocket.js
   ```

   The server will start and listen for WebSocket connections.

2. **Connect to the WebSocket server**:

   Use a WebSocket client to connect to the server. For example, you can use the following JavaScript code in a browser console:

   ```javascript
   const socket = new WebSocket('ws://localhost:8080');

   socket.onopen = function(event) {
     console.log('Connected to WebSocket server.');
     socket.send('Hello Server!');
   };

   socket.onmessage = function(event) {
     console.log('Message from server:', event.data);
   };

   socket.onclose = function(event) {
     console.log('Disconnected from WebSocket server.');
   };

   socket.onerror = function(error) {
     console.error('WebSocket error:', error);
   };
   ```

## Features

- Establishes a WebSocket server using Node.js.
- Handles client connections and messages.
- Demonstrates basic WebSocket events: `open`, `message`, `close`, and `error`.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
