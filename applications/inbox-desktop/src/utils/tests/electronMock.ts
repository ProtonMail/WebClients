jest.mock("electron", () => ({
    app: {
        on: jest.fn(),
        getPath: jest.fn(() => "/mock/home"),
        getVersion: jest.fn(() => "0.0.0"),
    },
    screen: {
        getDisplayNearestPoint: jest.fn(),
        getCursorScreenPoint: () => {},
    },
    session: {
        fromPartition: jest.fn(() => ({
            webRequest: {
                onBeforeRequest: jest.fn(),
                onResponseStarted: jest.fn(),
                onCompleted: jest.fn(),
                onErrorOccurred: jest.fn(),
                onBeforeSendHeaders: jest.fn(),
            },
            setPermissionRequestHandler: jest.fn(),
        })),
    },
}));

jest.mock("../electronSession/webRequestRouter", () => ({
    webRequestRouter: {
        onBeforeRequest: jest.fn(() => jest.fn()),
        onResponseStarted: jest.fn(() => jest.fn()),
        onCompleted: jest.fn(() => jest.fn()),
        onErrorOccurred: jest.fn(() => jest.fn()),
    },
}));
