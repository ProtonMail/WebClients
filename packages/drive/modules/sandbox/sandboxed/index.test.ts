import * as Comlink from 'comlink';
import { MessageChannel } from 'node:worker_threads';

import { INTERNAL_PING, SANDBOX_PROTOCOL_VERSION } from '../protocol';
import type * as SandboxedModule from './index';

type Sandboxed = typeof SandboxedModule;

// The sandboxed code keeps its port in module state, so each test loads a fresh copy and
// removes the copy's `message` listener afterwards.
const addListener = jest.spyOn(window, 'addEventListener');
const openPorts: { close(): void }[] = [];

const loadSandboxed = (): Sandboxed => {
    let sandboxed: Sandboxed | undefined;
    jest.isolateModules(() => {
        sandboxed = require('./index');
    });
    if (!sandboxed) {
        throw new Error('Sandboxed module did not load');
    }
    return sandboxed;
};

const sendInit = ({
    source = window,
    assets = {},
}: { source?: Window | null; assets?: Record<string, ArrayBuffer> } = {}) => {
    const { port1, port2 } = new MessageChannel();
    openPorts.push(port1, port2);
    window.dispatchEvent(
        new MessageEvent('message', {
            data: { type: 'sandbox-init', version: SANDBOX_PROTOCOL_VERSION, assets },
            source,
            ports: [port2 as unknown as MessagePort],
        })
    );
    return Comlink.wrap<Record<string, (...args: unknown[]) => Promise<unknown>>>(port1 as unknown as MessagePort);
};

const answers = (remote: ReturnType<typeof sendInit>) =>
    Promise.race([
        remote[INTERNAL_PING]().then(() => true),
        new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 100)),
    ]);

afterEach(() => {
    addListener.mock.calls.forEach(([type, listener]) => window.removeEventListener(type, listener));
    addListener.mockClear();
    openPorts.splice(0).forEach((port) => port.close());
});

describe('sandboxed runtime', () => {
    it('publishes the API once the init from the parent arrives', async () => {
        const sandboxed = loadSandboxed();
        sandboxed.expose({ echo: (value: string) => value });

        const remote = sendInit();

        expect(await answers(remote)).toBe(true);
        expect(await remote.echo('hello')).toBe('hello');
    });

    it('calls sandboxed methods with the API object as `this`', async () => {
        const sandboxed = loadSandboxed();
        sandboxed.expose({
            async outer() {
                return this.inner();
            },
            inner: () => 'inner',
        });

        const remote = sendInit();

        expect(await remote.outer()).toBe('inner');
    });

    it('publishes the API when the init lands before expose()', async () => {
        const sandboxed = loadSandboxed();
        const remote = sendInit();

        sandboxed.expose({ echo: (value: string) => value });

        expect(await remote.echo('hello')).toBe('hello');
    });

    it('ignores an init from a sibling frame', async () => {
        const sibling = document.createElement('iframe');
        document.body.appendChild(sibling);
        const sandboxed = loadSandboxed();
        sandboxed.expose({ echo: (value: string) => value });

        const remote = sendInit({ source: sibling.contentWindow });

        expect(await answers(remote)).toBe(false);
        sibling.remove();
    });

    it('accepts only the first init, so a later one cannot take over the port', async () => {
        const sandboxed = loadSandboxed();
        sandboxed.expose({ echo: (value: string) => value });

        const first = sendInit({ assets: { wasm: new Uint8Array([1]).buffer } });
        const second = sendInit({ assets: { wasm: new Uint8Array([2]).buffer } });

        expect(await answers(first)).toBe(true);
        expect(await answers(second)).toBe(false);
        expect(new Uint8Array(await sandboxed.getAsset('wasm'))).toEqual(new Uint8Array([1]));
    });

    it('hands over the asset bytes sent with the init', async () => {
        const sandboxed = loadSandboxed();
        sendInit({ assets: { wasm: new Uint8Array([0, 97, 115, 109]).buffer } });

        expect(new Uint8Array(await sandboxed.getAsset('wasm'))).toEqual(new Uint8Array([0, 97, 115, 109]));
        await expect(sandboxed.getAsset('missing')).rejects.toThrow('Sandbox asset not provided: missing');
    });
});
