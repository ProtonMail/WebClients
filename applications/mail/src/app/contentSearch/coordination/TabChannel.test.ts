import { flush } from '../testing/settlement';
import { TabChannel, type TabMessage } from './TabChannel';

let userCounter = 0;

describe('TabChannel', () => {
    const opened: { close: () => void }[] = [];

    /** a channel in each of two tabs, and the raw transport of a third that can post anything */
    const openTabs = () => {
        const userId = `tab-channel-${userCounter++}`;
        const sender = new TabChannel(new BroadcastChannel(`content-search:${userId}`));
        const receiver = new TabChannel(new BroadcastChannel(`content-search:${userId}`));
        const raw = new BroadcastChannel(`content-search:${userId}`);
        opened.push(sender, receiver, raw);
        const received: TabMessage[] = [];
        receiver.subscribe((message) => {
            received.push(message);
        });
        return { sender, receiver, raw, received };
    };

    afterEach(() => {
        opened.splice(0).forEach((channel) => {
            channel.close();
        });
    });

    it.each<TabMessage>([
        { type: 'status', status: 'enabled' },
        { type: 'status', status: 'paused' },
        { type: 'status', status: 'disabled' },
        { type: 'status', status: undefined },
        { type: 'progress', processed: 10, total: 200 },
        { type: 'indexComplete' },
        { type: 'version', version: '5.0.300.1' },
    ])('delivers %j to the other tabs', async (message) => {
        const { sender, received } = openTabs();

        sender.post(message);
        await flush();

        expect(received).toEqual([message]);
    });

    it.each<[string, unknown]>([
        ['an unknown type', { type: 'reload' }],
        ['a status that does not exist', { type: 'status', status: 'deleted' }],
        ['progress without numbers', { type: 'progress', processed: '1', total: 2 }],
        ['a version that is not a string', { type: 'version', version: 5 }],
        ['something that is not an object', 'indexComplete'],
        ['null', null],
    ])('ignores %s', async (_description, message) => {
        const { raw, received } = openTabs();

        raw.postMessage(message);
        await flush();

        expect(received).toEqual([]);
    });

    it('stops delivering once closed', async () => {
        const { sender, receiver, received } = openTabs();

        receiver.close();
        sender.post({ type: 'indexComplete' });
        await flush();

        expect(received).toEqual([]);
    });

    it('ignores what is posted once closed', async () => {
        const { sender, received } = openTabs();

        sender.close();
        sender.post({ type: 'indexComplete' });
        await flush();

        expect(received).toEqual([]);
    });
});
