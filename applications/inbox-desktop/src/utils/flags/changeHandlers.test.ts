jest.mock("../electronSession/appCache", () => ({ toggleAppCache: jest.fn() }));

import { toggleAppCache } from "../electronSession/appCache";
import { featureFlagChangeHandlers } from "./changeHandlers";
import { FeatureFlag } from "./flags";

describe("featureFlagChangeHandlers", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it.each([
        { disabled: true, appCacheEnabled: false },
        { disabled: false, appCacheEnabled: true },
    ])("should set app cache to $appCacheEnabled when flag is $disabled", ({ disabled, appCacheEnabled }) => {
        for (const handler of featureFlagChangeHandlers[FeatureFlag.APP_SESSION_CACHE_DISABLED] ?? []) {
            handler(disabled);
        }

        expect(toggleAppCache).toHaveBeenCalledTimes(1);
        expect(toggleAppCache).toHaveBeenCalledWith(appCacheEnabled);
    });
});
