import { VersionFile } from "@proton/shared/lib/desktop/DesktopVersion";
import { expectGetNewUpdate } from "./update.test.utils";

jest.mock("../utils/view/viewManagement", () => ({
    getCalendarView: () => {},
    getMailView: () => {},
}));

jest.mock("electron", () => ({
    app: { isPackaged: true },
    autoUpdater: {
        on: () => {},
    },
}));

const availableVersionsWithMininumSpec: VersionFile = {
    Releases: [
        {
            CategoryName: "Stable",
            Version: "1.2.0",
            ReleaseDate: "2024-06-01",
            MinimumAppVersion: "1.0.5",
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
            CategoryName: "Stable",
            Version: "1.0.5",
            ReleaseDate: "2024-06-01",
            MinimumAppVersion: "1.0.2",
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
            CategoryName: "Stable",
            Version: "1.0.2",
            ReleaseDate: "2024-06-01",
            MinimumAppVersion: "1.0.1",
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

const availableVersionsWithPartialMininumSpec: VersionFile = {
    Releases: [
        {
            CategoryName: "Stable",
            Version: "1.2.0",
            ReleaseDate: "2024-06-01",
            MinimumAppVersion: "1.0.5",
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
            CategoryName: "Stable",
            Version: "1.0.5",
            ReleaseDate: "2024-06-01",
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
            CategoryName: "Stable",
            Version: "1.0.2",
            ReleaseDate: "2024-06-01",
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

const availableVersionsWithEmptyMinimumSpec: VersionFile = {
    Releases: [
        {
            CategoryName: "Stable",
            Version: "1.2.0",
            ReleaseDate: "2024-06-01",
            MinimumAppVersion: "",
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

describe("MinimumVersion requirements", () => {
    describe.each([
        ["1.0.1", "1.0.2"],
        ["1.0.2", "1.0.5"],
        ["1.0.5", "1.2.0"],
    ])("cascading updates", (localVersion, expectedVersion) => {
        it(`updates from ${localVersion} to ${expectedVersion} (meets minimum)`, () => {
            expectGetNewUpdate(availableVersionsWithMininumSpec, {
                localVersion,
                expectedVersion,
            });
        });
    });

    describe.each([
        ["0.9.0", "1.0.1"],
        ["1.0.0", "1.0.1"],
    ])("versions below minimum", (localVersion, expectedVersion) => {
        it(`updates from ${localVersion} to ${expectedVersion} (does not meet any minimum)`, () => {
            expectGetNewUpdate(availableVersionsWithMininumSpec, {
                localVersion,
                expectedVersion,
            });
        });
    });

    it("skips versions with unmet minimums", () => {
        expectGetNewUpdate(availableVersionsWithMininumSpec, {
            localVersion: "1.0.3",
            expectedVersion: "1.0.5", // Skips 1.2.0, requires 1.0.5
        });
    });

    it("updates through the chain correctly", () => {
        expectGetNewUpdate(availableVersionsWithMininumSpec, {
            localVersion: "1.0.4",
            expectedVersion: "1.0.5", // Can reach 1.0.5, requires 1.0.2
        });
    });
});

describe("MinimumVersion requirements with kill-switch enabled", () => {
    describe.each([
        ["1.0.1", "1.2.0"],
        ["1.0.2", "1.2.0"],
        ["1.0.5", "1.2.0"],
    ])("cascading updates", (localVersion, expectedVersion) => {
        it(`updates from ${localVersion} to ${expectedVersion} (meets minimum)`, () => {
            expectGetNewUpdate(
                availableVersionsWithMininumSpec,
                {
                    localVersion,
                    expectedVersion,
                },
                true,
            );
        });
    });

    describe.each([
        ["0.9.0", "1.2.0"],
        ["1.0.0", "1.2.0"],
    ])("versions below minimum", (localVersion, expectedVersion) => {
        it(`updates from ${localVersion} to ${expectedVersion} (does not meet any minimum)`, () => {
            expectGetNewUpdate(
                availableVersionsWithMininumSpec,
                {
                    localVersion,
                    expectedVersion,
                },
                true,
            );
        });
    });

    it("skips versions with unmet minimums", () => {
        expectGetNewUpdate(
            availableVersionsWithMininumSpec,
            {
                localVersion: "1.0.3",
                expectedVersion: "1.2.0",
            },
            true,
        );
    });

    it("updates through the chain correctly", () => {
        expectGetNewUpdate(
            availableVersionsWithMininumSpec,
            {
                localVersion: "1.0.4",
                expectedVersion: "1.2.0",
            },
            true,
        );
    });
});

describe("Without partial MinimumVersion requirements", () => {
    describe.each([
        ["1.0.1", "1.0.5"],
        ["1.0.2", "1.0.5"],
        ["1.0.5", "1.2.0"],
    ])("cascading updates", (localVersion, expectedVersion) => {
        it(`updates from ${localVersion} to ${expectedVersion} (meets minimum)`, () => {
            expectGetNewUpdate(availableVersionsWithPartialMininumSpec, {
                localVersion,
                expectedVersion,
            });
        });
    });

    describe.each([
        ["0.9.0", "1.0.5"],
        ["1.0.0", "1.0.5"],
    ])("versions below minimum", (localVersion, expectedVersion) => {
        it(`updates from ${localVersion} to ${expectedVersion} (does not meet any minimum)`, () => {
            expectGetNewUpdate(availableVersionsWithPartialMininumSpec, {
                localVersion,
                expectedVersion,
            });
        });
    });

    it("skips versions with unmet minimums", () => {
        expectGetNewUpdate(availableVersionsWithPartialMininumSpec, {
            localVersion: "1.0.3",
            expectedVersion: "1.0.5", // Skips 1.2.0 ,requires 1.0.5
        });
    });

    it("updates through the chain correctly", () => {
        expectGetNewUpdate(availableVersionsWithPartialMininumSpec, {
            localVersion: "0.0.3",
            expectedVersion: "1.0.5", // Can reach 1.0.5, skip 1.2.0
        });
    });

    describe.each([
        ["0.9.0", "1.2.0"],
        ["1.1.5", "1.2.0"],
    ])("updates if minimum version string is empty", (localVersion, expectedVersion) => {
        it(`updates from ${localVersion} to ${expectedVersion} (with an empty minimum version string)`, () => {
            expectGetNewUpdate(availableVersionsWithEmptyMinimumSpec, {
                localVersion,
                expectedVersion,
            });
        });
    });
});

const availableVersionsWithMininumSpec_HighSemverValues: VersionFile = {
    Releases: [
        {
            CategoryName: "Stable",
            Version: "22.33.44",
            ReleaseDate: "2024-06-01",
            MinimumAppVersion: "22.30.15",
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
            CategoryName: "Stable",
            Version: "22.30.15",
            ReleaseDate: "2024-06-01",
            MinimumAppVersion: "22.28.7",
            File: [],
            ReleaseNotes: [],
            ManualUpdate: [],
            RolloutProportion: 1,
        },
        {
            CategoryName: "Stable",
            Version: "22.28.7",
            ReleaseDate: "2024-06-01",
            MinimumAppVersion: "22.25.3",
            File: [],
            ReleaseNotes: [],
            ManualUpdate: [],
            RolloutProportion: 1,
        },
        {
            CategoryName: "Stable",
            Version: "22.25.3",
            ReleaseDate: "2024-03-21",
            File: [],
            ReleaseNotes: [],
            ManualUpdate: [],
            RolloutProportion: 1,
        },
    ],
};

describe("MinimumVersion requirements", () => {
    describe.each([
        ["22.25.3", "22.28.7"],
        ["22.28.7", "22.30.15"],
        ["22.30.15", "22.33.44"],
    ])("cascading updates", (localVersion, expectedVersion) => {
        it(`updates from ${localVersion} to ${expectedVersion} (meets minimum)`, () => {
            expectGetNewUpdate(availableVersionsWithMininumSpec_HighSemverValues, {
                localVersion,
                expectedVersion,
            });
        });
    });

    describe.each([
        ["22.20.0", "22.25.3"],
        ["22.24.0", "22.25.3"],
    ])("versions below minimum", (localVersion, expectedVersion) => {
        it(`updates from ${localVersion} to ${expectedVersion} (does not meet any minimum)`, () => {
            expectGetNewUpdate(availableVersionsWithMininumSpec_HighSemverValues, {
                localVersion,
                expectedVersion,
            });
        });
    });

    it("skips versions with unmet minimums", () => {
        expectGetNewUpdate(availableVersionsWithMininumSpec_HighSemverValues, {
            localVersion: "22.29.0",
            expectedVersion: "22.30.15",
        });
    });

    it("updates through the chain correctly", () => {
        expectGetNewUpdate(availableVersionsWithMininumSpec_HighSemverValues, {
            localVersion: "22.29.10",
            expectedVersion: "22.30.15",
        });
    });
});
