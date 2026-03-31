jest.mock("@sentry/electron/main", () => ({
    addBreadcrumb: jest.fn(),
    captureException: jest.fn(),
    captureMessage: jest.fn(),
    childProcessIntegration: jest.fn(() => ({ name: "ChildProcess" })),
    electronMinidumpIntegration: jest.fn(() => ({ name: "ElectronMinidump" })),
    flush: jest.fn().mockResolvedValue(true),
    init: jest.fn(),
    setTag: jest.fn(),
    setTags: jest.fn(),
    setUser: jest.fn(),
    withScope: jest.fn((cb) =>
        cb({
            setExtras: jest.fn(),
            setTags: jest.fn(),
            setLevel: jest.fn(),
            setContext: jest.fn(),
        }),
    ),
}));
