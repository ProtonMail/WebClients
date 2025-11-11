import { RELEASE_CATEGORIES } from "@proton/shared/lib/constants";
import { getNewUpdateTestOnly, releaseListSchemaTestOnly } from "./update";
import { VersionFile } from "@proton/shared/lib/desktop/DesktopVersion";

type newUpdateTestData = {
    localCategory?: RELEASE_CATEGORIES;
    localVersion?: string;
    localRollout?: number;
    expectedVersion?: string;
    expectedCategory?: string;
    expectedRollout?: number;
};

export function expectGetNewUpdate(
    availableVersions: VersionFile,
    td: newUpdateTestData,
    electronAndOSVersionConstraintsDisabled: boolean = false,
) {
    td.localCategory ??= RELEASE_CATEGORIES.STABLE;
    td.localVersion ??= "1.0.0";
    td.localRollout ??= 1;
    td.expectedCategory ??= td.localCategory;
    td.expectedRollout ??= 1;

    const have = getNewUpdateTestOnly(
        { Version: td.localVersion, RolloutProportion: td.localRollout, CategoryName: td.localCategory },
        releaseListSchemaTestOnly.parse(availableVersions),
        electronAndOSVersionConstraintsDisabled,
    );

    if (!td.expectedVersion) {
        expect(have).toBeUndefined();
        return;
    }

    expect(have).toBeDefined();

    expect({
        Version: have!.Version,
        CategoryName: have!.CategoryName,
        RolloutProportion: have!.RolloutProportion,
    }).toEqual({
        Version: td.expectedVersion,
        CategoryName: td.expectedCategory,
        RolloutProportion: td.expectedRollout,
    });
}
