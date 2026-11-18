vi.mock("@sentry/electron/main", () => ({
    addBreadcrumb: vi.fn(),
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    childProcessIntegration: vi.fn(() => ({ name: "ChildProcess" })),
    electronMinidumpIntegration: vi.fn(() => ({ name: "ElectronMinidump" })),
    flush: vi.fn().mockResolvedValue(true),
    init: vi.fn(),
    setTag: vi.fn(),
    setTags: vi.fn(),
    setUser: vi.fn(),
    withScope: vi.fn((cb) =>
        cb({
            setExtras: vi.fn(),
            setTags: vi.fn(),
            setLevel: vi.fn(),
            setContext: vi.fn(),
            setFingerprint: vi.fn(),
        }),
    ),
}));
