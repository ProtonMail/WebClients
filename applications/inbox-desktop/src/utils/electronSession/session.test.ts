import { describe, expect } from "vitest";
import {
    destroyFeatureFlagManagerTest,
    getFeatureFlagManager,
    initializeFeatureFlagManagerTest,
} from "../flags/manager";
import { FeatureFlag } from "../flags/flags";

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

const TEST_ENABLED_FLAG = {
    name: FeatureFlag.APPVERSION_EXTENSION_DISABLED,
    enabled: true,
    impressionData: false,
    variant: { name: "disabled", enabled: false },
};

const TEST_DISABLED_FLAG = {
    name: FeatureFlag.APPVERSION_EXTENSION_DISABLED,
    enabled: false,
    impressionData: false,
    variant: { name: "disabled", enabled: false },
};

const TEST_UNRELATED_FLAG = {
    name: "AsyncReportAttachment",
    enabled: true,
    impressionData: false,
    variant: { name: "disabled", enabled: false },
};

describe("retrieve", () => {
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

    it("finds flag and is enabled", async () => {
        mockExecuteJavaScript.mockResolvedValue([TEST_UNRELATED_FLAG, TEST_ENABLED_FLAG]);
        initializeFeatureFlagManagerTest({ store: mockStore });
        const manager = getFeatureFlagManager();

        await mockExecuteJavaScript.mock.results[0].value;
        expect(manager.isEnabled(FeatureFlag.APPVERSION_EXTENSION_DISABLED)).toBeTruthy();
    });

    it("was enabled, but finds flag and is disabled", async () => {
        const pollInterval = 600;
        mockExecuteJavaScript.mockResolvedValue([TEST_UNRELATED_FLAG, TEST_ENABLED_FLAG]);
        initializeFeatureFlagManagerTest({ store: mockStore, pollInterval: pollInterval });
        const manager = getFeatureFlagManager();

        await mockExecuteJavaScript.mock.results[0].value;
        expect(manager.isEnabled(FeatureFlag.APPVERSION_EXTENSION_DISABLED)).toBeTruthy();

        mockExecuteJavaScript.mockResolvedValue([TEST_DISABLED_FLAG]);
        vi.advanceTimersByTime(pollInterval);
        await Promise.resolve();

        await mockExecuteJavaScript.mock.results[0].value;
        expect(manager.isEnabled(FeatureFlag.APPVERSION_EXTENSION_DISABLED)).toBeFalsy();
    });

    it("it doesn't find flag", async () => {
        initializeFeatureFlagManagerTest({ store: mockStore });
        const manager = getFeatureFlagManager();

        await mockExecuteJavaScript.mock.results[0].value;
        expect(manager.isEnabled(FeatureFlag.APPVERSION_EXTENSION_DISABLED)).toBeFalsy();
    });

    it("flag was cached", async () => {
        mockStore.get.mockReturnValue({
            flags: {
                [FeatureFlag.APPVERSION_EXTENSION_DISABLED]: true,
            },
            lastUpdated: Date.now(),
        });

        initializeFeatureFlagManagerTest({ store: mockStore });
        const manager = getFeatureFlagManager();

        expect(manager.isEnabled(FeatureFlag.APPVERSION_EXTENSION_DISABLED)).toBeTruthy();
    });
});
