vi.mock("electron", () => ({
    app: {
        on: vi.fn(),
        getPath: vi.fn(() => "/mock/home"),
        getAppPath: vi.fn(() => "/mock/app"),
        getVersion: vi.fn(() => "0.0.0"),
    },
    screen: {
        getDisplayNearestPoint: vi.fn(),
        getCursorScreenPoint: () => {},
    },
    session: {
        fromPartition: vi.fn(() => ({
            webRequest: {
                onBeforeRequest: vi.fn(),
                onResponseStarted: vi.fn(),
                onCompleted: vi.fn(),
                onErrorOccurred: vi.fn(),
                onBeforeSendHeaders: vi.fn(),
            },
            setPermissionRequestHandler: vi.fn(),
        })),
    },
}));

vi.mock("../electronSession/webRequestRouter", () => ({
    webRequestRouter: {
        onBeforeRequest: vi.fn(() => vi.fn()),
        onResponseStarted: vi.fn(() => vi.fn()),
        onCompleted: vi.fn(() => vi.fn()),
        onErrorOccurred: vi.fn(() => vi.fn()),
    },
}));
