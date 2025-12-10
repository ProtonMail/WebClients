import { destroyFeatureFlagManagerTest, getFeatureFlagManager, initializeFeatureFlagManagerTest } from "./manager";

jest.mock("electron-store");

const mockExecuteJavaScript = jest.fn();
const mockGetMeetView = jest.fn();

jest.mock("../view/viewManagement", () => ({
    getMeetView: () => mockGetMeetView(),
}));

import { FeatureFlag } from "./flags";

describe("FeatureFlagManager", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockStore: any;

    beforeEach(() => {
        destroyFeatureFlagManagerTest();
        jest.clearAllMocks();
        jest.useFakeTimers();

        mockStore = {
            get: jest.fn().mockReturnValue({
                flags: {},
                lastUpdated: 0,
            }),
            set: jest.fn(),
        };

        mockGetMeetView.mockReturnValue({
            webContents: {
                executeJavaScript: mockExecuteJavaScript,
            },
        });

        mockExecuteJavaScript.mockResolvedValue(null);
    });

    describe("Initialization", () => {
        it("should initialize with default values from cache", () => {
            initializeFeatureFlagManagerTest({ store: mockStore });
            expect(mockStore.get).toHaveBeenCalledWith("featureFlags");
        });

        it("should load cached flags on initialization", () => {
            mockStore.get.mockReturnValue({
                flags: {
                    [FeatureFlag.MEET_DESKTOP_DEV_TOOLS_ENABLED]: true,
                },
                lastUpdated: Date.now(),
            });

            initializeFeatureFlagManagerTest({ store: mockStore });
            const manager = getFeatureFlagManager();
            expect(manager.isEnabled(FeatureFlag.MEET_DESKTOP_DEV_TOOLS_ENABLED)).toBe(true);
        });

        it("should start periodic check on initialization with fast retry", () => {
            initializeFeatureFlagManagerTest({
                store: mockStore,
            });

            // Should execute immediately on initialization
            expect(mockExecuteJavaScript).toHaveBeenCalledTimes(1);
        });
    });

    describe("Flag checking", () => {
        const fastRetryMargin = 5100;

        it("should check flags periodically with fast retry", () => {
            initializeFeatureFlagManagerTest({ store: mockStore });
            mockExecuteJavaScript.mockClear();

            // Fast retry interval (5s)
            jest.advanceTimersByTime(fastRetryMargin);

            expect(mockExecuteJavaScript).toHaveBeenCalledTimes(1);
            expect(mockExecuteJavaScript).toHaveBeenCalledWith(
                'localStorage.getItem("unleash:repository:repo");',
                true,
            );
        });

        it("should check flags periodically and continuously with fast retry", () => {
            initializeFeatureFlagManagerTest({ store: mockStore });
            mockExecuteJavaScript.mockClear();

            const count = 10;
            jest.advanceTimersByTime(fastRetryMargin * count);

            expect(mockExecuteJavaScript).toHaveBeenCalledTimes(count);
            expect(mockExecuteJavaScript).toHaveBeenCalledWith(
                'localStorage.getItem("unleash:repository:repo");',
                true,
            );
        });

        it("should not check flags if view is not available", () => {
            mockGetMeetView.mockReturnValue(null);
            initializeFeatureFlagManagerTest({ store: mockStore });
            mockExecuteJavaScript.mockClear();

            jest.advanceTimersByTime(fastRetryMargin);

            expect(mockExecuteJavaScript).not.toHaveBeenCalled();
        });

        it("should not check flags if webContents is not available", () => {
            mockGetMeetView.mockReturnValue({});
            initializeFeatureFlagManagerTest({ store: mockStore });
            mockExecuteJavaScript.mockClear();

            jest.advanceTimersByTime(fastRetryMargin);

            expect(mockExecuteJavaScript).not.toHaveBeenCalled();
        });
    });

    describe("Flag updates", () => {
        it("should update flags from remote data", async () => {
            const flagData = [{ name: FeatureFlag.MEET_DESKTOP_DEV_TOOLS_ENABLED, enabled: true }];
            mockExecuteJavaScript.mockResolvedValue(JSON.stringify(flagData));

            initializeFeatureFlagManagerTest({ store: mockStore });
            const manager = getFeatureFlagManager();

            await mockExecuteJavaScript.mock.results[0].value;

            expect(manager.isEnabled(FeatureFlag.MEET_DESKTOP_DEV_TOOLS_ENABLED)).toBe(true);
        });

        it("should handle already parsed JSON data", async () => {
            const flagData = [{ name: FeatureFlag.MEET_DESKTOP_DEV_TOOLS_ENABLED, enabled: true }];

            mockExecuteJavaScript.mockResolvedValue(flagData);

            initializeFeatureFlagManagerTest({ store: mockStore });
            const manager = getFeatureFlagManager();

            await mockExecuteJavaScript.mock.results[0].value;

            expect(manager.isEnabled(FeatureFlag.MEET_DESKTOP_DEV_TOOLS_ENABLED)).toBe(true);
        });

        it("should ignore null or undefined flag data", async () => {
            mockExecuteJavaScript.mockResolvedValue(null);

            initializeFeatureFlagManagerTest({ store: mockStore });
            await mockExecuteJavaScript.mock.results[0].value;

            expect(mockStore.set).not.toHaveBeenCalled();
        });

        it("should ignore invalid JSON", async () => {
            mockExecuteJavaScript.mockResolvedValue("invalid json{");

            initializeFeatureFlagManagerTest({ store: mockStore });
            await mockExecuteJavaScript.mock.results[0].value;

            expect(mockStore.set).not.toHaveBeenCalled();
        });

        it("should ignore non-array data", async () => {
            mockExecuteJavaScript.mockResolvedValue(JSON.stringify({ not: "array" }));

            initializeFeatureFlagManagerTest({ store: mockStore });
            await mockExecuteJavaScript.mock.results[0].value;

            expect(mockStore.set).not.toHaveBeenCalled();
        });

        it("should ignore strings with dangerous patterns to prevent prototype pollution", async () => {
            const dangerousPayloads = [
                '{"__proto__": {"polluted": true}}',
                '{"constructor": {"polluted": true}}',
                '{"prototype": {"polluted": true}}',
                '{"__defineGetter__": "malicious"}',
                '{"__defineSetter__": "malicious"}',
                '{"__lookupGetter__": "malicious"}',
                '{"__lookupSetter__": "malicious"}',
            ];

            for (const payload of dangerousPayloads) {
                mockExecuteJavaScript.mockResolvedValue(payload);
                initializeFeatureFlagManagerTest({ store: mockStore });
                await mockExecuteJavaScript.mock.results[0].value;
                destroyFeatureFlagManagerTest();
            }

            expect(mockStore.set).not.toHaveBeenCalled();
        });

        it("should ignore strings that are too long to prevent DoS attacks", async () => {
            const tooLongString = "a".repeat(100001);
            mockExecuteJavaScript.mockResolvedValue(tooLongString);

            initializeFeatureFlagManagerTest({ store: mockStore });
            await mockExecuteJavaScript.mock.results[0].value;

            expect(mockStore.set).not.toHaveBeenCalled();
        });

        it("should ignore empty strings", async () => {
            mockExecuteJavaScript.mockResolvedValue("");

            initializeFeatureFlagManagerTest({ store: mockStore });
            await mockExecuteJavaScript.mock.results[0].value;

            expect(mockStore.set).not.toHaveBeenCalled();
        });

        it("should reset flags not found in remote data", async () => {
            mockStore.get.mockReturnValue({
                flags: {
                    [FeatureFlag.MEET_DESKTOP_DEV_TOOLS_ENABLED]: true,
                },
                lastUpdated: Date.now(),
            });

            mockExecuteJavaScript.mockResolvedValue(JSON.stringify([]));

            initializeFeatureFlagManagerTest({ store: mockStore });
            const manager = getFeatureFlagManager();

            // Should be true before the check.
            expect(manager.isEnabled(FeatureFlag.MEET_DESKTOP_DEV_TOOLS_ENABLED)).toBe(true);

            await mockExecuteJavaScript.mock.results[0].value;

            // Should be false after the check since flag wasn't in remote data.
            expect(manager.isEnabled(FeatureFlag.MEET_DESKTOP_DEV_TOOLS_ENABLED)).toBe(false);
        });

        it("should save to cache after updating flags", async () => {
            const flagData = [{ name: FeatureFlag.MEET_DESKTOP_DEV_TOOLS_ENABLED, enabled: true }];

            mockExecuteJavaScript.mockResolvedValue(JSON.stringify(flagData));

            initializeFeatureFlagManagerTest({ store: mockStore });
            await mockExecuteJavaScript.mock.results[0].value;

            expect(mockStore.set).toHaveBeenCalledWith("featureFlags", {
                flags: expect.any(Object),
                lastUpdated: expect.any(Number),
            });
        });

        it("should save to cache after updating flags and destroying", async () => {
            let storedData = {
                flags: {},
                lastUpdated: 0,
            };

            mockStore = {
                get: jest.fn().mockImplementation(() => storedData),
                set: jest.fn().mockImplementation((key, value) => {
                    storedData = value;
                }),
            };

            const flagData = [{ name: FeatureFlag.MEET_DESKTOP_DEV_TOOLS_ENABLED, enabled: true }];
            mockExecuteJavaScript.mockResolvedValue(JSON.stringify(flagData));

            initializeFeatureFlagManagerTest({ store: mockStore });
            await mockExecuteJavaScript.mock.results[0].value;

            expect(mockStore.set).toHaveBeenCalledWith("featureFlags", {
                flags: expect.any(Object),
                lastUpdated: expect.any(Number),
            });

            destroyFeatureFlagManagerTest();

            initializeFeatureFlagManagerTest({ store: mockStore });
            const manager = getFeatureFlagManager();

            expect(mockStore.get).toHaveBeenCalledWith("featureFlags");
            expect(storedData.flags).toEqual(expect.any(Object));
            expect(storedData.lastUpdated).toBeGreaterThan(0);
            expect(manager.isEnabled(FeatureFlag.MEET_DESKTOP_DEV_TOOLS_ENABLED)).toBe(true);
        });
    });

    describe("isEnabled", () => {
        it("should return false for unset flags", () => {
            initializeFeatureFlagManagerTest({ store: mockStore });
            const manager = getFeatureFlagManager();

            expect(manager.isEnabled(FeatureFlag.MEET_DESKTOP_DEV_TOOLS_ENABLED)).toBe(false);
        });

        it("should return correct value for set flags", () => {
            mockStore.get.mockReturnValue({
                flags: {
                    [FeatureFlag.MEET_DESKTOP_DEV_TOOLS_ENABLED]: true,
                },
                lastUpdated: Date.now(),
            });

            initializeFeatureFlagManagerTest({ store: mockStore });
            const manager = getFeatureFlagManager();

            expect(manager.isEnabled(FeatureFlag.MEET_DESKTOP_DEV_TOOLS_ENABLED)).toBe(true);
        });
    });

    describe("Singleton pattern", () => {
        it("should initialize singleton", () => {
            initializeFeatureFlagManagerTest({ store: mockStore });
            const manager = getFeatureFlagManager();

            expect(manager).toBeDefined();
        });

        it("should return same instance", () => {
            initializeFeatureFlagManagerTest({ store: mockStore });

            const manager1 = getFeatureFlagManager();
            const manager2 = getFeatureFlagManager();

            expect(manager1).toBe(manager2);
        });

        it("should not reinitialize if already initialized", () => {
            initializeFeatureFlagManagerTest({ store: mockStore });
            const callCountBefore = mockStore.get.mock.calls.length;

            initializeFeatureFlagManagerTest({ store: mockStore });
            const callCountAfter = mockStore.get.mock.calls.length;

            expect(callCountAfter).toBe(callCountBefore);
        });
    });
});
