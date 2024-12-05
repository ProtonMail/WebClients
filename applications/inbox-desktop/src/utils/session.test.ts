import { describe, expect } from "@jest/globals";

import {
    updateFlagsTestOnly,
    isAppVersionExtensionDisabledTestOnly,
    FEATURE_FLAG_APPVERSION_EXTENSION_DISABLED,
} from "./session";

const TEST_ENABLED_FLAG = {
    name: FEATURE_FLAG_APPVERSION_EXTENSION_DISABLED,
    enabled: true,
    impressionData: false,
    variant: { name: "disabled", enabled: false },
};

const TEST_DISABLED_FLAG = {
    name: FEATURE_FLAG_APPVERSION_EXTENSION_DISABLED,
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

const resetFlag = () => {
    updateFlagsTestOnly('[{"name":"something", "enabled": true}]');
    expect(isAppVersionExtensionDisabledTestOnly()).toBeFalsy();
};

describe("retrieve feature flag from list", () => {
    it("finds flag and is enabled", () => {
        resetFlag();
        updateFlagsTestOnly([TEST_UNRELATED_FLAG, TEST_ENABLED_FLAG]);
        expect(isAppVersionExtensionDisabledTestOnly()).toBeTruthy();
    });
    it("was enabled, but finds flag and is disabled", () => {
        resetFlag();
        updateFlagsTestOnly([TEST_UNRELATED_FLAG, TEST_ENABLED_FLAG]);
        expect(isAppVersionExtensionDisabledTestOnly()).toBeTruthy();

        updateFlagsTestOnly([TEST_DISABLED_FLAG]);
        expect(isAppVersionExtensionDisabledTestOnly()).toBeFalsy();
    });

    it("doesn't find flag", () => {
        updateFlagsTestOnly([TEST_UNRELATED_FLAG, TEST_ENABLED_FLAG]);
        expect(isAppVersionExtensionDisabledTestOnly()).toBeTruthy();
        resetFlag();
    });

    it("wrong input, keeps value", () => {
        updateFlagsTestOnly([TEST_UNRELATED_FLAG, TEST_ENABLED_FLAG]);
        expect(isAppVersionExtensionDisabledTestOnly()).toBeTruthy();

        updateFlagsTestOnly([{ something: "else" }, { totally: false }]);
        updateFlagsTestOnly([]);
        updateFlagsTestOnly(TEST_DISABLED_FLAG);
        updateFlagsTestOnly(undefined);
        updateFlagsTestOnly('[{"enabled":false}]');
        updateFlagsTestOnly('[{"name":false}]');
        expect(isAppVersionExtensionDisabledTestOnly()).toBeTruthy();

        resetFlag();

        updateFlagsTestOnly([{ something: "else" }, { totally: false }]);
        updateFlagsTestOnly([]);
        updateFlagsTestOnly(TEST_ENABLED_FLAG);
        updateFlagsTestOnly("this is wrong");
        updateFlagsTestOnly("{}");
        updateFlagsTestOnly('["enabled"]');
        updateFlagsTestOnly(undefined);
        updateFlagsTestOnly('[{"enabled":true}]');
        expect(isAppVersionExtensionDisabledTestOnly()).toBeFalsy();
    });

    it("stops on first found flag", () => {
        resetFlag();
        updateFlagsTestOnly([
            TEST_UNRELATED_FLAG,
            TEST_UNRELATED_FLAG,
            TEST_DISABLED_FLAG,
            TEST_UNRELATED_FLAG,
            TEST_UNRELATED_FLAG,
            TEST_UNRELATED_FLAG,
            TEST_UNRELATED_FLAG,
            TEST_ENABLED_FLAG,
        ]);
        expect(isAppVersionExtensionDisabledTestOnly()).toBeFalsy();

        updateFlagsTestOnly([
            TEST_UNRELATED_FLAG,
            TEST_UNRELATED_FLAG,
            TEST_ENABLED_FLAG,
            TEST_UNRELATED_FLAG,
            TEST_UNRELATED_FLAG,
            TEST_UNRELATED_FLAG,
            TEST_UNRELATED_FLAG,
            TEST_UNRELATED_FLAG,
            TEST_DISABLED_FLAG,
        ]);
        expect(isAppVersionExtensionDisabledTestOnly()).toBeTruthy();
    });
});
