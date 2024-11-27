const { connectWebSocket } = require('./connect_websocket');

// Listen for the "team_chat.channel_message_posted" event
async function listenForChannelMessages() {
    try {
        console.log('Initializing WebSocket connection...');
        
        // Create the WebSocket connection
        const socket = await connectWebSocket();

        // Add event listener for messages
        socket.addEventListener('message', (event) => {
            try {
                // Parse the received message
                const messageData = JSON.parse(event.data);

                // Check if the event type is "team_chat.channel_message_posted"
                if (messageData.event === 'team_chat.channel_message_posted') {
                    const { channel_name, message } = messageData.payload;
                    console.log(`Message received in channel "${channel_name}": ${message}`);
                }
            } catch (error) {
                console.error('Error parsing message data:', error);
            }
        });

        socket.addEventListener('error', (error) => {
            console.error('WebSocket error:', error);
        });

        socket.addEventListener('close', () => {
            console.warn('WebSocket connection closed.');
        });

        console.log('Listening for "team_chat.channel_message_posted" events...');
    } catch (error) {
        console.error('Error initializing WebSocket connection:', error);
    }
}

// Invoke the listener
listenForChannelMessages();
