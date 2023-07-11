const https = require('https');
const ws = require('ws');
const noop = () => {};

/**
 * Creates a WS server over HTTPS (Firefox
 * automatically upgrades all ws:// to wss://
 * by default) which the extension will connect
 * to in dev mode : this allows triggering runtime
 * reloads when webpack's HMR server emits new data
 */
const createReloadRuntimeServer = ({ cert, key, port = 9090 }) => {
    const httpsServer = https.createServer({ cert, key });

    console.info('[ProtonPassExtensionReloader] - Setting runtime reloader server');

    const server = new ws.Server({ server: httpsServer, pingTimeout: 10000 });
    server.on('pong', noop);

    const reloadClients = () => {
        console.info('[ProtonPassExtensionReloader] - Reloading clients..');
        server.clients.forEach((client) => {
            client.send(JSON.stringify({ reload: true }));
        });
    };

    process.on('beforeExit', () => server.close());
    httpsServer.listen(port);

    return { reload: reloadClients };
};

module.exports = createReloadRuntimeServer;
