/** Stripped down version of `@redux-devtools/cli` server.
 * This avoids adding the redux-devtools as a dev-dependency
 * considering it ships the whole jungle (electron, apollo..) */
import http from 'node:http';
import socketClusterServer from 'socketcluster-server';

export const createReduxDevServer = async (port: number) => {
    const httpServer = http.createServer();
    const agServer = socketClusterServer.attach(httpServer, { port, allowClientPublish: false });

    agServer.setMiddleware(agServer.MIDDLEWARE_INBOUND, async (middlewareStream) => {
        for await (const action of middlewareStream) {
            if (action.type === action.TRANSMIT) {
                const { receiver: channel, data } = action;

                if (channel.startsWith('sc-') || ['respond', 'log'].includes(channel)) {
                    void agServer.exchange.transmitPublish(channel, data);
                } else if (channel === 'log-noid') {
                    void agServer.exchange.transmitPublish('log', { id: action.socket.id, data });
                }
            }
            action.allow();
        }
    });

    void (async () => {
        for await (const { socket } of agServer.listener('connection')) {
            let emitChannel = 'respond';

            void (async () => {
                for await (const request of socket.procedure('login')) {
                    emitChannel = request.data === 'master' ? 'log' : 'respond';
                    request.end(request.data === 'master' ? 'respond' : 'log');
                }
            })();

            void (async () => {
                for await (const _ of socket.listener('disconnect')) {
                    void agServer.exchange.transmitPublish(emitChannel, {
                        id: socket.id,
                        type: 'DISCONNECTED',
                    });
                }
            })();
        }
    })();

    httpServer.listen(port);

    return {
        server: httpServer,
        ready: agServer.listener('ready' as any).once(),
    };
};
