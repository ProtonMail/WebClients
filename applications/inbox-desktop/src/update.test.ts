import { getNewUpdateTestOnly, LocalDesktopVersion, releaseListSchemaTestOnly } from "./update";
import { describe } from "@jest/globals";
import { RELEASE_CATEGORIES } from "./utils/external/packages/shared/lib/apps/desktopVersions";
import { VersionFile } from "./utils/external/packages/shared/lib/desktop/DesktopVersion";

jest.mock("./utils/view/viewManagement", () => ({
    getCalendarView: () => {},
    getMailView: () => {},
}));

jest.mock("electron", () => ({
    app: { isPackaged: true },
    autoUpdater: {
        on: () => {},
    },
}));

const availableVersions: VersionFile = {
    Releases: [
        {
            CategoryName: "Stable",
            Version: "0.9.9",
            ReleaseDate: "2024-03-21",
            File: [
                {
                    Identifier: ".deb (Ubuntu/Debian)",
                    Url: "https://proton.me/download/mail/linux/ProtonMail-desktop-beta.deb",
                    Sha512CheckSum:
                        "cc772a801ba6086ace8b313215c46352a88aea6627287b5219ae2963fde1d5d434f8d6ac9fd469a971693ec0d0813b387de8c94af021f41bad993d145937f293",
                },
                {
                    Identifier: ".rpm (Fedora/RHEL)",
                    Url: "https://proton.me/download/mail/linux/ProtonMail-desktop-beta.rpm",
                    Sha512CheckSum:
                        "de38e6f11b91ab3ff5e987fe6b14d430a8911ec45b94ed7f95b758cb3d542b73cc0551142e4f94950209fa445bc8fdfd9ac3d13d50aafc183be829a0c01298e2",
                },
            ],
            ReleaseNotes: [],
            ManualUpdate: [],
            RolloutProportion: 1,
        },
        {
            CategoryName: "Alpha",
            Version: "1.0.4",
            ReleaseDate: "2024-05-28",
            File: [
                {
                    Identifier: ".deb (Ubuntu/Debian)",
                    Url: "https://proton.me/download/mail/linux/ProtonMail-desktop-beta.deb",
                    Sha512CheckSum:
                        "8d23105dc8aa0d3320b113937ad94f057b040a603cc6353a266b3e563a6cefa1a9368e8dec53c377417d6f79fd325375d338dd8dd8506a2b0526658f6981668b",
                },
                {
                    Identifier: ".rpm (Fedora/RHEL)",
                    Url: "https://proton.me/download/mail/linux/ProtonMail-desktop-beta.rpm",
                    Sha512CheckSum:
                        "c6b8a68545d8a7814953f6e343b362512faaa789cd46b95c4ffecf0f83444ba5b79104e33242a10d3836f6c6fe7d338e9e8e8f6113c0bcbe2a6027da58ea857c",
                },
            ],
            ReleaseNotes: [],
            ManualUpdate: [],
            RolloutProportion: 0,
        },
        {
            CategoryName: "Alpha",
            Version: "1.0.3",
            ReleaseDate: "2024-05-28",
            File: [
                {
                    Identifier: ".deb (Ubuntu/Debian)",
                    Url: "https://proton.me/download/mail/linux/ProtonMail-desktop-beta.deb",
                    Sha512CheckSum:
                        "8d23105dc8aa0d3320b113937ad94f057b040a603cc6353a266b3e563a6cefa1a9368e8dec53c377417d6f79fd325375d338dd8dd8506a2b0526658f6981668b",
                },
                {
                    Identifier: ".rpm (Fedora/RHEL)",
                    Url: "https://proton.me/download/mail/linux/ProtonMail-desktop-beta.rpm",
                    Sha512CheckSum:
                        "c6b8a68545d8a7814953f6e343b362512faaa789cd46b95c4ffecf0f83444ba5b79104e33242a10d3836f6c6fe7d338e9e8e8f6113c0bcbe2a6027da58ea857c",
                },
            ],
            ReleaseNotes: [],
            ManualUpdate: [],
            RolloutProportion: 0.2,
        },
        {
            CategoryName: "EarlyAccess",
            Version: "1.0.2",
            ReleaseDate: "2024-05-10",
            File: [
                {
                    Identifier: ".deb (Ubuntu/Debian)",
                    Url: "https://proton.me/download/mail/linux/ProtonMail-desktop-beta.deb",
                    Sha512CheckSum:
                        "eaf1fcd37619da321d1aeab509df3ffa238ca9a22bddfb540358315e3c1f01a45d7a9f03194e732b25b9aabbdfb95f342142d440612157c00f285c8cd5db46e9",
                },
                {
                    Identifier: ".rpm (Fedora/RHEL)",
                    Url: "https://proton.me/download/mail/linux/ProtonMail-desktop-beta.rpm",
                    Sha512CheckSum:
                        "5fcd824913ead17e9040a9212c84df5badca1600ae38d8e3245ccdafe062bc68d7be703b2339a0ff5eda33f355b578808ac2e881918433bfa9323556ab00d558",
                },
            ],
            ReleaseNotes: [],
            ManualUpdate: [],
            RolloutProportion: 0.5,
        },
        {
            CategoryName: "Stable",
            Version: "1.0.1",
            ReleaseDate: "2024-03-21",
            File: [
                {
                    Identifier: ".deb (Ubuntu/Debian)",
                    Url: "https://proton.me/download/mail/linux/ProtonMail-desktop-beta.deb",
                    Sha512CheckSum:
                        "cc772a801ba6086ace8b313215c46352a88aea6627287b5219ae2963fde1d5d434f8d6ac9fd469a971693ec0d0813b387de8c94af021f41bad993d145937f293",
                },
                {
                    Identifier: ".rpm (Fedora/RHEL)",
                    Url: "https://proton.me/download/mail/linux/ProtonMail-desktop-beta.rpm",
                    Sha512CheckSum:
                        "de38e6f11b91ab3ff5e987fe6b14d430a8911ec45b94ed7f95b758cb3d542b73cc0551142e4f94950209fa445bc8fdfd9ac3d13d50aafc183be829a0c01298e2",
                },
            ],
            ReleaseNotes: [],
            ManualUpdate: [],
            RolloutProportion: 1,
        },
    ],
};

type newUpdateTestData = {
    localCategory?: RELEASE_CATEGORIES;
    localVersion?: string;
    localRollout?: number;
    expectedVersion?: string;
    expectedCategory?: string;
    expectedRollout?: number;
};

function expectGetNewUpdate(td: newUpdateTestData) {
    td.localCategory ??= RELEASE_CATEGORIES.STABLE;
    td.localVersion ??= "1.0.0";
    td.localRollout ??= 1;
    td.expectedCategory ??= td.localCategory;
    td.expectedRollout ??= 1;

    const have = getNewUpdateTestOnly(
        { Version: td.localVersion, RolloutProportion: td.localRollout, CategoryName: td.localCategory },
        releaseListSchemaTestOnly.parse(availableVersions),
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
    } satisfies LocalDesktopVersion).toStrictEqual({
        Version: td.expectedVersion,
        CategoryName: td.expectedCategory,
        RolloutProportion: td.expectedRollout,
    } satisfies LocalDesktopVersion);
}

describe("get new update", () => {
    describe.each([
        [RELEASE_CATEGORIES.STABLE, "1.0.0", 1, "1.0.1", 1],
        [RELEASE_CATEGORIES.EARLY_ACCESS, "1.0.1", 0.5, "1.0.2", 0.5],
        [RELEASE_CATEGORIES.ALPHA, "1.0.2", 0.2, "1.0.3", 0.2],
    ])("for each category", (localCategory, localVersion, localRollout, expectedVersion, expectedRollout) => {
        it(`finds a new ${localCategory} version if rollout is same as local`, () => {
            expectGetNewUpdate({
                localCategory,
                localVersion,
                localRollout,
                expectedVersion,
                expectedRollout,
            });
        });

        it(`finds a new ${localCategory} version if rollout is higher than local`, () => {
            expectGetNewUpdate({
                localCategory,
                localVersion,
                localRollout: localRollout - 0.1,
                expectedVersion,
                expectedRollout,
            });
        });

        it(`finds no new ${localCategory} version if rollout too low`, () => {
            expectGetNewUpdate({
                localCategory,
                localVersion,
                localRollout: localRollout + 0.2,
                expectedVersion: "",
                expectedRollout,
            });
        });
    });

    it("finds beta version if rollout is not enough for alpha", () => {
        expectGetNewUpdate({
            localCategory: RELEASE_CATEGORIES.ALPHA,
            localVersion: "0.0.9", // really old
            localRollout: 0.5, // same as beta, more than alpha
            expectedCategory: RELEASE_CATEGORIES.EARLY_ACCESS,
            expectedVersion: "1.0.2",
            expectedRollout: 0.5,
        });
    });

    it("finds stable version if rollout is not enough for alpha or beta", () => {
        expectGetNewUpdate({
            localCategory: RELEASE_CATEGORIES.ALPHA,
            localVersion: "0.0.9", // really old
            localRollout: 1, // more than beta, more than alpha
            expectedCategory: RELEASE_CATEGORIES.STABLE,
            expectedVersion: "1.0.1",
            expectedRollout: 1,
        });
    });

    it("finds stable version if rollout is not enough for beta", () => {
        expectGetNewUpdate({
            localCategory: RELEASE_CATEGORIES.EARLY_ACCESS,
            localVersion: "0.0.9", // really old
            localRollout: 1, // more than beta, more than alpha
            expectedCategory: RELEASE_CATEGORIES.STABLE,
            expectedVersion: "1.0.1",
            expectedRollout: 1,
        });
    });
});
