import { destroyFeatureFlagManagerTest, getFeatureFlagManager, initializeFeatureFlagManagerTest } from "./manager";

vi.mock("../../store/safeStore/safeStore", () => ({
    SafeStore: class {
        get = vi.fn();
        set = vi.fn();
        delete = vi.fn();
    },
}));

vi.mock("../log", () => ({
    flagManagerLogger: {
        info: vi.fn(),
        debug: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    },
}));

const mockExecuteJavaScript = vi.fn();
const mockGetMailView = vi.fn();

vi.mock("../view/viewState", () => ({
    getMailView: () => mockGetMailView(),
}));

import { flagManagerLogger } from "../log";
import { FeatureFlag } from "./flags";

describe("FeatureFlagManager", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mockStore: any;

    beforeEach(() => {
        destroyFeatureFlagManagerTest();
        vi.clearAllMocks();
        vi.useFakeTimers();

        mockStore = {
            get: vi.fn().mockReturnValue({
                flags: {},
                lastUpdated: 0,
            }),
            set: vi.fn(),
        };

        mockGetMailView.mockReturnValue({
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
            expect(flagManagerLogger.info).toHaveBeenCalledWith("Feature flags loaded from cache", expect.any(Object));
        });

        it("should load cached flags on initialization", () => {
            mockStore.get.mockReturnValue({
                flags: {
                    [FeatureFlag.INDA_TEST_FLAG_1]: true,
                },
                lastUpdated: Date.now(),
            });

            initializeFeatureFlagManagerTest({ store: mockStore });
            const manager = getFeatureFlagManager();
            expect(manager.isEnabled(FeatureFlag.INDA_TEST_FLAG_1)).toBe(true);
        });

        it("should start periodic check on initialization", () => {
            const pollInterval = 6000;
            initializeFeatureFlagManagerTest({
                store: mockStore,
                pollInterval,
            });

            expect(mockExecuteJavaScript).toHaveBeenCalledTimes(1);
            expect(flagManagerLogger.info).toHaveBeenCalledWith("Feature flag periodic check started", {
                intervalMS: pollInterval,
            });
        });
    });

    describe("Flag checking", () => {
        const pollInterval = 6000;
        const pollIntervalMargin = 6500;

        it("should check flags periodically", () => {
            initializeFeatureFlagManagerTest({ store: mockStore, pollInterval });
            mockExecuteJavaScript.mockClear();

            vi.advanceTimersByTime(pollIntervalMargin);

            expect(mockExecuteJavaScript).toHaveBeenCalledTimes(1);
            expect(mockExecuteJavaScript).toHaveBeenCalledWith(
                'localStorage.getItem("unleash:repository:repo");',
                true,
            );
        });

        it("should check flags periodically and continously", () => {
            initializeFeatureFlagManagerTest({ store: mockStore, pollInterval });
            mockExecuteJavaScript.mockClear();

            const count = 10;
            vi.advanceTimersByTime(pollIntervalMargin * count);

            expect(mockExecuteJavaScript).toHaveBeenCalledTimes(count);
            expect(mockExecuteJavaScript).toHaveBeenCalledWith(
                'localStorage.getItem("unleash:repository:repo");',
                true,
            );
        });

        it("should not check flags if view is not available", () => {
            mockGetMailView.mockReturnValue(null);
            initializeFeatureFlagManagerTest({ store: mockStore, pollInterval });
            mockExecuteJavaScript.mockClear();

            vi.advanceTimersByTime(pollIntervalMargin);

            expect(mockExecuteJavaScript).not.toHaveBeenCalled();
        });

        it("should not check flags if webContents is not available", () => {
            mockGetMailView.mockReturnValue({});
            initializeFeatureFlagManagerTest({ store: mockStore, pollInterval });
            mockExecuteJavaScript.mockClear();

            vi.advanceTimersByTime(pollIntervalMargin);

            expect(mockExecuteJavaScript).not.toHaveBeenCalled();
        });
    });

    describe("Flag updates", () => {
        it("should update flags from remote data", async () => {
            const flagData = [
                { name: FeatureFlag.INDA_TEST_FLAG_1, enabled: true },
                { name: FeatureFlag.INDA_TEST_FLAG_2, enabled: false },
            ];
            mockExecuteJavaScript.mockResolvedValue(JSON.stringify(flagData));

            initializeFeatureFlagManagerTest({ store: mockStore });
            const manager = getFeatureFlagManager();

            await mockExecuteJavaScript.mock.results[0].value;

            expect(manager.isEnabled(FeatureFlag.INDA_TEST_FLAG_1)).toBe(true);
            expect(manager.isEnabled(FeatureFlag.INDA_TEST_FLAG_2)).toBe(false);
        });

        it("should handle already parsed JSON data", async () => {
            const flagData = [
                { name: FeatureFlag.INDA_TEST_FLAG_1, enabled: true },
                { name: FeatureFlag.INDA_TEST_FLAG_2, enabled: true },
            ];

            mockExecuteJavaScript.mockResolvedValue(flagData);

            initializeFeatureFlagManagerTest({ store: mockStore });
            const manager = getFeatureFlagManager();

            await mockExecuteJavaScript.mock.results[0].value;

            expect(manager.isEnabled(FeatureFlag.INDA_TEST_FLAG_1)).toBe(true);
            expect(manager.isEnabled(FeatureFlag.INDA_TEST_FLAG_2)).toBe(true);
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

        it("should keep cached flags when remote data is an empty list", async () => {
            mockStore.get.mockReturnValue({
                flags: { [FeatureFlag.INDA_TEST_FLAG_1]: true },
                lastUpdated: Date.now(),
            });
            mockExecuteJavaScript.mockResolvedValue(JSON.stringify([]));

            initializeFeatureFlagManagerTest({ store: mockStore });
            const manager = getFeatureFlagManager();
            await mockExecuteJavaScript.mock.results[0].value;

            expect(manager.isEnabled(FeatureFlag.INDA_TEST_FLAG_1)).toBe(true);
            expect(mockStore.set).not.toHaveBeenCalled();
        });

        it("should reset flags not found in remote data", async () => {
            mockStore.get.mockReturnValue({
                flags: {
                    [FeatureFlag.INDA_TEST_FLAG_1]: true,
                    [FeatureFlag.INDA_TEST_FLAG_2]: true,
                },
                lastUpdated: Date.now(),
            });

            mockExecuteJavaScript.mockResolvedValue(
                JSON.stringify([{ name: FeatureFlag.INDA_TEST_FLAG_1, enabled: true }]),
            );

            initializeFeatureFlagManagerTest({ store: mockStore });
            const manager = getFeatureFlagManager();

            // Both should be true before the check.
            expect(manager.isEnabled(FeatureFlag.INDA_TEST_FLAG_1)).toBe(true);
            expect(manager.isEnabled(FeatureFlag.INDA_TEST_FLAG_2)).toBe(true);

            await mockExecuteJavaScript.mock.results[0].value;

            expect(manager.isEnabled(FeatureFlag.INDA_TEST_FLAG_1)).toBe(true);
            expect(manager.isEnabled(FeatureFlag.INDA_TEST_FLAG_2)).toBe(false);
        });

        it("should save to cache after updating flags", async () => {
            const flagData = [{ name: FeatureFlag.INDA_TEST_FLAG_1, enabled: true }];

            mockExecuteJavaScript.mockResolvedValue(JSON.stringify(flagData));

            initializeFeatureFlagManagerTest({ store: mockStore });
            await mockExecuteJavaScript.mock.results[0].value;

            expect(mockStore.set).toHaveBeenCalledWith("featureFlags", {
                flags: expect.any(Object),
                lastUpdated: expect.any(Number),
            });
            expect(flagManagerLogger.debug).toHaveBeenCalledWith("Feature flags saved to cache");
        });

        it("should save to cache after updating flags and destorying", async () => {
            let storedData = {
                flags: {},
                lastUpdated: 0,
            };

            mockStore = {
                get: vi.fn().mockImplementation(() => storedData),
                set: vi.fn().mockImplementation((key, value) => {
                    storedData = value;
                }),
            };

            const flagData = [{ name: FeatureFlag.INDA_TEST_FLAG_1, enabled: true }];
            mockExecuteJavaScript.mockResolvedValue(JSON.stringify(flagData));

            initializeFeatureFlagManagerTest({ store: mockStore });
            await mockExecuteJavaScript.mock.results[0].value;

            expect(mockStore.set).toHaveBeenCalledWith("featureFlags", {
                flags: expect.any(Object),
                lastUpdated: expect.any(Number),
            });
            expect(flagManagerLogger.debug).toHaveBeenCalledWith("Feature flags saved to cache");

            destroyFeatureFlagManagerTest();

            initializeFeatureFlagManagerTest({ store: mockStore });
            const manager = getFeatureFlagManager();

            expect(mockStore.get).toHaveBeenCalledWith("featureFlags");
            expect(storedData.flags).toEqual(expect.any(Object));
            expect(storedData.lastUpdated).toBeGreaterThan(0);
            expect(manager.isEnabled(FeatureFlag.INDA_TEST_FLAG_1)).toBe(true);
        });
    });

    describe("Flag change handlers", () => {
        it("should call handlers with cached values on startup", () => {
            const handler = vi.fn();
            mockStore.get.mockReturnValue({
                flags: { [FeatureFlag.INDA_TEST_FLAG_1]: true },
                lastUpdated: Date.now(),
            });

            initializeFeatureFlagManagerTest({
                store: mockStore,
                flagChangeHandlers: { [FeatureFlag.INDA_TEST_FLAG_1]: [handler] },
            });

            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith(true);
        });

        it("should not call handlers on startup for flags absent from cache", () => {
            const handler = vi.fn();

            initializeFeatureFlagManagerTest({
                store: mockStore,
                flagChangeHandlers: { [FeatureFlag.INDA_TEST_FLAG_1]: [handler] },
            });

            expect(handler).not.toHaveBeenCalled();
        });

        it("should call handlers with the new value when a flag changes", async () => {
            const handler = vi.fn();
            mockExecuteJavaScript.mockResolvedValue(
                JSON.stringify([{ name: FeatureFlag.INDA_TEST_FLAG_1, enabled: true }]),
            );

            initializeFeatureFlagManagerTest({
                store: mockStore,
                flagChangeHandlers: { [FeatureFlag.INDA_TEST_FLAG_1]: [handler] },
            });
            await mockExecuteJavaScript.mock.results[0].value;

            expect(handler).toHaveBeenCalledTimes(1);
            expect(handler).toHaveBeenCalledWith(true);
        });

        it("should not call handlers again when a flag value is unchanged", async () => {
            const handler = vi.fn();
            mockStore.get.mockReturnValue({
                flags: { [FeatureFlag.INDA_TEST_FLAG_1]: true },
                lastUpdated: Date.now(),
            });
            mockExecuteJavaScript.mockResolvedValue(
                JSON.stringify([{ name: FeatureFlag.INDA_TEST_FLAG_1, enabled: true }]),
            );

            initializeFeatureFlagManagerTest({
                store: mockStore,
                flagChangeHandlers: { [FeatureFlag.INDA_TEST_FLAG_1]: [handler] },
            });
            handler.mockClear();
            await mockExecuteJavaScript.mock.results[0].value;

            expect(handler).not.toHaveBeenCalled();
        });

        it("should keep updating flags when a handler throws", async () => {
            const throwingHandler = vi.fn(() => {
                throw new Error("handler failure");
            });
            mockExecuteJavaScript.mockResolvedValue(
                JSON.stringify([
                    { name: FeatureFlag.INDA_TEST_FLAG_1, enabled: true },
                    { name: FeatureFlag.INDA_TEST_FLAG_2, enabled: true },
                ]),
            );

            initializeFeatureFlagManagerTest({
                store: mockStore,
                flagChangeHandlers: { [FeatureFlag.INDA_TEST_FLAG_1]: [throwingHandler] },
            });
            const manager = getFeatureFlagManager();
            await mockExecuteJavaScript.mock.results[0].value;

            expect(flagManagerLogger.error).toHaveBeenCalledWith("Flag change handler failure", {
                flag: FeatureFlag.INDA_TEST_FLAG_1,
                error: expect.any(Error),
            });
            expect(manager.isEnabled(FeatureFlag.INDA_TEST_FLAG_2)).toBe(true);
            expect(mockStore.set).toHaveBeenCalled();
        });
    });

    describe("isEnabled", () => {
        it("should return false for unset flags", () => {
            initializeFeatureFlagManagerTest({ store: mockStore });
            const manager = getFeatureFlagManager();

            expect(manager.isEnabled(FeatureFlag.INDA_TEST_FLAG_1)).toBe(false);
        });

        it("should return correct value for set flags", () => {
            mockStore.get.mockReturnValue({
                flags: {
                    [FeatureFlag.INDA_TEST_FLAG_1]: true,
                },
                lastUpdated: Date.now(),
            });

            initializeFeatureFlagManagerTest({ store: mockStore });
            const manager = getFeatureFlagManager();

            expect(manager.isEnabled(FeatureFlag.INDA_TEST_FLAG_1)).toBe(true);
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
