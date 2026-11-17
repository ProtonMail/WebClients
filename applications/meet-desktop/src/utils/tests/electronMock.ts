vi.mock("electron", () => ({
    screen: {
        getDisplayNearestPoint: vi.fn(),
        getCursorScreenPoint: () => {},
    },
}));

// Requires the real "electron" package, which has no binary in CI
vi.mock("update-electron-app", () => ({
    updateElectronApp: vi.fn(),
    UpdateSourceType: { ElectronPublicUpdateService: 1, StaticStorage: 2 },
}));
