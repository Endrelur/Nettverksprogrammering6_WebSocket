/**
 * A class that implements a WebSocket.
 */
class WebSocketServer {

    #webSocketServer;

    constructor() {
        const net = require('net');
        this.#webSocketServer = net.createServer(socket => {
            socket.on('data', data => {
                let returnString = WebSocketServer.#generateServerReply(data);
                if (returnString !== null) {
                    console.log("WebSocketServer replied with: \n" + returnString);
                    socket.write(returnString);
                }
            });
        });
    }

    /**
     * Makes the websocket server listen for connections on the given port.
     *
     * @param port the port that the server should listen for connections from.
     */
    listen(port) {
        this.#webSocketServer.listen(port, () => console.log('WebSocketServer is listening on port: ' + port));
    }

    /**
     * Generates a reply to some given data.
     *
     * @param data the data to generate a reply to.
     * @returns {null,string} returns reply to the given data.
     */
    static #generateServerReply(data) {
        let returnString = null;
        if (WebSocketServer.#isHttp(data) && WebSocketServer.#isSocketUpgradeRequest(data)) {
            //the server received a upgrade request.
            console.log("WebSocketServer received a upgrade request: \n" + data.toString());
            returnString = WebSocketServer.#generateHandshakeMsg(data);
        } else {
            //the server received some other data.
            console.log('The server received some data: \n' + data.toString());
        }
        return returnString;
    }

    /**
     * Checks if some given data is a WebSocket upgrade request.
     *
     * @param data the data to check if contains a WebSocket upgrade request.
     * @returns {boolean} true if it is a upgrade request, false if not.
     */
    static #isSocketUpgradeRequest(data) {
        let isUpgrade = false;
        data.toString().split('\n').forEach(headerLine => {
            if (headerLine.includes('Upgrade: websocket')) {
                isUpgrade = true;
            }
        });
        return isUpgrade;
    }

    /**
     * Checks if some given data is on the HTTP/1.1 protocol format.
     *
     * @param data The data to check if is on the HTTP/1.1 format.
     * @returns {boolean} true if it is HTTP, false if not.
     */
    static #isHttp(data) {
        return data.toString().split('\n')[0].includes('HTTP/1.1');
    }

    /**
     * Generates a a handshake message based on the given data.
     *
     * @param data the data to generate WebSocket handshake reply based on.
     * @returns {string} the websocket handshake server reply.
     */
    static #generateHandshakeMsg(data) {
        let msg = 'HTTP/1.1 400 Bad Request';


        function generateServerKey(key) {
            const guid = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";
            return require('crypto')
                .createHash('sha1')//uses SHA-1 hash.
                .update(key + guid, 'binary')//concatenate the client key with the GUID.
                .digest('base64'); //encode in base64.
        }

        let clientKey = null;
        //try to find the client key from the HTTP headers.
        data.toString().split('\n').forEach(headerLine => {
            //searches for the headerline that is related to the websocket key.
            if (headerLine.startsWith('Sec-WebSocket-Key:', 0)) {
                //found the line, now saves the key to a local let.
                clientKey = headerLine.substr(19).slice(0, -1);
            }
        });
        if (clientKey !== null) {
            msg =
                'HTTP/1.1 101 Switching Protocols\n' +
                'Upgrade: websocket\n' +
                'Connection: Upgrade\n' +
                'Sec-WebSocket-Accept: ' + generateServerKey(clientKey);
        }
        return msg;


    }
}

module.exports.WeebSocketServer = WebSocketServer;