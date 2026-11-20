// The contract of every ChannelTransport. Two instances with the same user stand for two tabs.
import { flush } from '../testing/settlement';
import type { ChannelTransport } from './ChannelTransport';

const transportFactories: [string, (userId: string) => ChannelTransport][] = [
    [
        'BroadcastChannel',
        (userId) => {
            return new BroadcastChannel(`content-search:${userId}`);
        },
    ],
];

let userCounter = 0;

describe.each(transportFactories)('ChannelTransport contract: %s', (_name, createTransport) => {
    const opened: ChannelTransport[] = [];

    const openTabs = (count: number, userId = `channel-transport-${userCounter++}`) => {
        return Array.from({ length: count }, () => {
            const transport = createTransport(userId);
            opened.push(transport);
            const received: unknown[] = [];
            transport.addEventListener('message', (event) => {
                received.push(event.data);
            });
            return { transport, received };
        });
    };

    afterEach(() => {
        opened.splice(0).forEach((transport) => {
            transport.close();
        });
    });

    it('delivers a message to every other tab of the user', async () => {
        const [sender, other, another] = openTabs(3);

        sender.transport.postMessage({ type: 'hello', value: 1 });
        await flush();

        expect(other.received).toEqual([{ type: 'hello', value: 1 }]);
        expect(another.received).toEqual([{ type: 'hello', value: 1 }]);
    });

    it('does not deliver a message back to the tab that posted it', async () => {
        const [sender] = openTabs(2);

        sender.transport.postMessage('hello');
        await flush();

        expect(sender.received).toEqual([]);
    });

    it('does not deliver to the tabs of another user', async () => {
        const [sender] = openTabs(1);
        const [otherUser] = openTabs(1);

        sender.transport.postMessage('hello');
        await flush();

        expect(otherUser.received).toEqual([]);
    });

    it('stops delivering to a tab once it is closed', async () => {
        const [sender, closed] = openTabs(2);

        closed.transport.close();
        sender.transport.postMessage('hello');
        await flush();

        expect(closed.received).toEqual([]);
    });

    it('stops delivering to a listener once it is removed', async () => {
        const userId = `channel-transport-${userCounter++}`;
        const [sender] = openTabs(1, userId);
        const receiver = createTransport(userId);
        opened.push(receiver);
        const received: unknown[] = [];
        const listener = (event: MessageEvent) => {
            received.push(event.data);
        };
        receiver.addEventListener('message', listener);

        receiver.removeEventListener('message', listener);
        sender.transport.postMessage('hello');
        await flush();

        expect(received).toEqual([]);
    });
});
