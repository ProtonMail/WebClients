const http = require('http');
const ws = require('ws');
const noop = () => {};

/**
 * this allows triggering runtime
 * reloads when webpack's HMR server emits new data
 */
const createReloadRuntimeServer = ({ port }) => {
    const httpServer = http.createServer({});

    console.info('[ProtonPassExtensionReloader] - Setting runtime reloader server');

    const server = new ws.Server({ server: httpServer, pingTimeout: 10000 });
    server.on('pong', noop);

    const reloadClients = () => {
        console.info('[ProtonPassExtensionReloader] - Reloading clients..');
        server.clients.forEach((client) => {
            client.send(JSON.stringify({ reload: true }));
        });
    };

    process.on('beforeExit', () => server.close());
    httpServer.listen(port);

    return { reload: reloadClients };
};

module.exports = createReloadRuntimeServer;
