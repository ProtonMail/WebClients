jest.unmock("./webRequestRouter");

let completedListener: ((d: unknown) => void) | null = null;
let beforeRequestListener: ((d: unknown, cb: (r: unknown) => void) => void) | null = null;

const mockSession = {
    webRequest: {
        onCompleted: jest.fn((cb) => {
            completedListener = cb;
        }),
        onBeforeRequest: jest.fn((cb) => {
            beforeRequestListener = cb;
        }),
        onResponseStarted: jest.fn(),
        onErrorOccurred: jest.fn(),
    },
};

let webRequestRouter: typeof import("./webRequestRouter").webRequestRouter;

beforeEach(async () => {
    jest.doMock("../session", () => ({ appSession: () => mockSession }));
    await jest.isolateModulesAsync(async () => {
        ({ webRequestRouter } = await import("./webRequestRouter"));
    });
});

afterEach(() => jest.resetModules());

describe("WebRequestRouter", () => {
    it("fans out onCompleted events to all subscribers", () => {
        const handler1 = jest.fn();
        const handler2 = jest.fn();

        webRequestRouter.onCompleted(handler1);
        webRequestRouter.onCompleted(handler2);

        const details = { url: "https://example.com" };
        completedListener!(details);

        expect(handler1).toHaveBeenCalledWith(details);
        expect(handler2).toHaveBeenCalledWith(details);

        const details2 = { url: "https://example2.com" };
        completedListener!(details2);

        expect(handler1).toHaveBeenCalledWith(details2);
        expect(handler2).toHaveBeenCalledWith(details2);

        completedListener!(details2);
        completedListener!(details2);

        expect(handler1).toHaveBeenCalledTimes(4);
        expect(handler2).toHaveBeenCalledTimes(4);
    });

    it("stops calling unsubscribed handler but keeps the other", () => {
        const handler1 = jest.fn();
        const handler2 = jest.fn();

        webRequestRouter.onCompleted(handler1);
        const unsub2 = webRequestRouter.onCompleted(handler2);

        const details = { url: "https://example.com" };
        completedListener!(details);
        expect(handler1).toHaveBeenCalledTimes(1);
        expect(handler2).toHaveBeenCalledTimes(1);

        completedListener!(details);
        completedListener!(details);

        expect(handler1).toHaveBeenCalledTimes(3);
        expect(handler2).toHaveBeenCalledTimes(3);

        unsub2();
        completedListener!(details);
        completedListener!(details);

        expect(handler1).toHaveBeenCalledTimes(5);
        expect(handler2).toHaveBeenCalledTimes(3);
    });

    it("passes null to Electron and stops dispatching when the last handler unsubscribes", () => {
        const handler = jest.fn();
        const unsub = webRequestRouter.onCompleted(handler);

        const details = { url: "https://example.com" };
        completedListener!(details);
        expect(handler).toHaveBeenCalledTimes(1);

        mockSession.webRequest.onCompleted.mockClear();
        unsub();

        // Electron receives null; no active dispatcher remains
        expect(mockSession.webRequest.onCompleted).toHaveBeenLastCalledWith(null);
        expect(handler).toHaveBeenCalledTimes(1);
    });

    it("always calls callback({}) for onBeforeRequest", () => {
        const handler = jest.fn();
        webRequestRouter.onBeforeRequest(handler);

        const details = { url: "https://example.com" };
        const callback = jest.fn();
        beforeRequestListener!(details, callback);

        expect(handler).toHaveBeenCalledWith(details);
        expect(callback).toHaveBeenCalledWith({});
    });
});
