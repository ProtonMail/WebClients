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

const mockGetOSVersion = jest.fn();
const mockIsMac = jest.fn();

jest.mock("../utils/helpers", () => ({
    isMacMockable: jest.fn((...args) => mockIsMac(...args)),
    getOSVersion: jest.fn((...args) => mockGetOSVersion(...args)),
}));

const availableVersionsWithMinimumOsVersion: VersionFile = {
    Releases: [
        {
            CategoryName: "Stable",
            Version: "1.0.6",
            ReleaseDate: "2024-06-15",
            MinimumOsVersion: "14.0.0",
            File: [
                {
                    Identifier: ".deb (Ubuntu/Debian)",
                    Url: "https://proton.me/download/mail/linux/ProtonMail-desktop-beta.deb",
                    Sha512CheckSum:
                        "cc772a801ba6086ace8b313215c46352a88aea6627287b5219ae2963fde1d5d434f8d6ac9fd469a971693ec0d0813b387de8c94af021f41bad993d145937f293",
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
            ],
            ReleaseNotes: [],
            ManualUpdate: [],
            RolloutProportion: 1,
        },
    ],
};

const availableVersionsWithNoMinimumOsVersion: VersionFile = {
    Releases: [
        {
            CategoryName: "Stable",
            Version: "1.0.8",
            ReleaseDate: "2024-08-01",
            File: [
                {
                    Identifier: ".deb (Ubuntu/Debian)",
                    Url: "https://proton.me/download/mail/linux/ProtonMail-desktop-beta.deb",
                    Sha512CheckSum:
                        "cc772a801ba6086ace8b313215c46352a88aea6627287b5219ae2963fde1d5d434f8d6ac9fd469a971693ec0d0813b387de8c94af021f41bad993d145937f293",
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
            ],
            ReleaseNotes: [],
            ManualUpdate: [],
            RolloutProportion: 1,
        },
    ],
};

describe("MinimumOsVersion", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsMac.mockReturnValue(true);
        mockGetOSVersion.mockReturnValue("15.0.0");
    });

    describe("macOS platform with MinimumOsVersion", () => {
        describe.each([
            ["12.0.1", "1.0.1"],
            ["12.5.6", "1.0.1"],
            ["13.0.0", "1.0.1"],
            ["13.9.9", "1.0.1"],
        ])("OS version below minimum", (osVersion, expectedVersion) => {
            it(`updates to ${expectedVersion} when on macOS ${osVersion} (below 14.0.0 requirement)`, () => {
                mockGetOSVersion.mockReturnValue(osVersion);
                expectGetNewUpdate(availableVersionsWithMinimumOsVersion, {
                    localVersion: "1.0.0",
                    expectedVersion,
                });
            });
        });

        describe.each([
            ["14.0.0", "1.0.6"],
            ["14.0.1", "1.0.6"],
            ["14.5.0", "1.0.6"],
            ["15.0.0", "1.0.6"],
            ["15.1.0", "1.0.6"],
        ])("OS version meets or exceeds minimum", (osVersion, expectedVersion) => {
            it(`updates to ${expectedVersion} when on macOS ${osVersion} (meets 14.0.0 requirement)`, () => {
                mockGetOSVersion.mockReturnValue(osVersion);
                expectGetNewUpdate(availableVersionsWithMinimumOsVersion, {
                    localVersion: "1.0.0",
                    expectedVersion,
                });
            });
        });
    });

    describe("non-macOS platforms (MinimumOsVersion only enforced on macOS)", () => {
        describe.each([
            ["linux", "1.0.0"],
            ["linux", "5.0.0"],
            ["linux", "6.0.0"],
            ["linux", "17.0.0"],
            ["windows", "1.0.0"],
            ["windows", "10.0.0"],
            ["windows", "11.0.0"],
            ["windows", "17.0.0"],
        ])("ignores MinimumOsVersion", (platform, osVersion) => {
            it(`updates to 1.0.6 on ${platform} ${osVersion} (MinimumOsVersion only enforced on macOS)`, () => {
                mockIsMac.mockReturnValue(false);
                mockGetOSVersion.mockReturnValue(osVersion);
                expectGetNewUpdate(availableVersionsWithMinimumOsVersion, {
                    localVersion: "1.0.0",
                    expectedVersion: "1.0.6",
                });
            });
        });
    });

    describe("no MinimumOsVersion specified", () => {
        it("allows update on macOS when no MinimumOsVersion exists", () => {
            mockIsMac.mockReturnValue(true);
            mockGetOSVersion.mockReturnValue("13.0.0");
            expectGetNewUpdate(availableVersionsWithNoMinimumOsVersion, {
                localVersion: "1.0.0",
                expectedVersion: "1.0.8",
            });
        });

        it("allows update on Windows when no MinimumOsVersion exists", () => {
            mockIsMac.mockReturnValue(false);
            mockGetOSVersion.mockReturnValue("10.0.0");
            expectGetNewUpdate(availableVersionsWithNoMinimumOsVersion, {
                localVersion: "1.0.0",
                expectedVersion: "1.0.8",
            });
        });

        it("allows update on Linux when no MinimumOsVersion exists", () => {
            mockIsMac.mockReturnValue(false);
            mockGetOSVersion.mockReturnValue("4.0.0");
            expectGetNewUpdate(availableVersionsWithNoMinimumOsVersion, {
                localVersion: "1.0.0",
                expectedVersion: "1.0.8",
            });
        });
    });

    describe("edge cases", () => {
        beforeEach(() => {
            mockIsMac.mockReturnValue(true);
        });

        it("handles exact version match on boundary", () => {
            mockGetOSVersion.mockReturnValue("14.0.0");
            expectGetNewUpdate(availableVersionsWithMinimumOsVersion, {
                localVersion: "1.0.0",
                expectedVersion: "1.0.6",
            });
        });

        it("handles version just below boundary", () => {
            mockGetOSVersion.mockReturnValue("13.9.9");
            expectGetNewUpdate(availableVersionsWithMinimumOsVersion, {
                localVersion: "1.0.0",
                expectedVersion: "1.0.1",
            });
        });

        it("handles empty electron OS version", () => {
            mockGetOSVersion.mockReturnValue("");
            expectGetNewUpdate(availableVersionsWithMinimumOsVersion, {
                localVersion: "1.0.0",
                expectedVersion: "1.0.1",
            });
        });

        it("handles malformed electron OS version", () => {
            mockGetOSVersion.mockReturnValue("13.99.99.99.99");
            expectGetNewUpdate(availableVersionsWithMinimumOsVersion, {
                localVersion: "1.0.0",
                expectedVersion: "1.0.1",
            });
        });

        it("handles undefined MinimumOsVersion on macOS", () => {
            mockGetOSVersion.mockReturnValue("13.0.0");
            expectGetNewUpdate(availableVersionsWithNoMinimumOsVersion, {
                localVersion: "1.0.0",
                expectedVersion: "1.0.8",
            });
        });
    });
});

describe("MinimumOsVersion With Kill switch enabled", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockIsMac.mockReturnValue(true);
        mockGetOSVersion.mockReturnValue("15.0.0");
    });

    describe("macOS platform with MinimumOsVersion", () => {
        describe.each([
            ["12.0.1", "1.0.6"],
            ["12.5.6", "1.0.6"],
            ["13.0.0", "1.0.6"],
            ["13.9.9", "1.0.6"],
        ])("OS version below minimum", (osVersion, expectedVersion) => {
            it(`updates to ${expectedVersion} when on macOS ${osVersion} (below 14.0.0 requirement)`, () => {
                mockGetOSVersion.mockReturnValue(osVersion);
                expectGetNewUpdate(
                    availableVersionsWithMinimumOsVersion,
                    {
                        localVersion: "1.0.0",
                        expectedVersion,
                    },
                    true,
                );
            });
        });

        describe.each([
            ["14.0.0", "1.0.6"],
            ["14.0.1", "1.0.6"],
            ["14.5.0", "1.0.6"],
            ["15.0.0", "1.0.6"],
            ["15.1.0", "1.0.6"],
        ])("OS version meets or exceeds minimum", (osVersion, expectedVersion) => {
            it(`updates to ${expectedVersion} when on macOS ${osVersion} (meets 14.0.0 requirement)`, () => {
                mockGetOSVersion.mockReturnValue(osVersion);
                expectGetNewUpdate(
                    availableVersionsWithMinimumOsVersion,
                    {
                        localVersion: "1.0.0",
                        expectedVersion,
                    },
                    true,
                );
            });
        });
    });

    describe("non-macOS platforms (MinimumOsVersion only enforced on macOS)", () => {
        describe.each([
            ["linux", "1.0.0"],
            ["linux", "5.0.0"],
            ["linux", "6.0.0"],
            ["linux", "17.0.0"],
            ["windows", "1.0.0"],
            ["windows", "10.0.0"],
            ["windows", "11.0.0"],
            ["windows", "17.0.0"],
        ])("ignores MinimumOsVersion", (platform, osVersion) => {
            it(`updates to 1.0.6 on ${platform} ${osVersion} (MinimumOsVersion only enforced on macOS)`, () => {
                mockIsMac.mockReturnValue(false);
                mockGetOSVersion.mockReturnValue(osVersion);
                expectGetNewUpdate(
                    availableVersionsWithMinimumOsVersion,
                    {
                        localVersion: "1.0.0",
                        expectedVersion: "1.0.6",
                    },
                    true,
                );
            });
        });
    });

    describe("no MinimumOsVersion specified", () => {
        it("allows update on macOS when no MinimumOsVersion exists", () => {
            mockIsMac.mockReturnValue(true);
            mockGetOSVersion.mockReturnValue("13.0.0");
            expectGetNewUpdate(
                availableVersionsWithNoMinimumOsVersion,
                {
                    localVersion: "1.0.0",
                    expectedVersion: "1.0.8",
                },
                true,
            );
        });

        it("allows update on Windows when no MinimumOsVersion exists", () => {
            mockIsMac.mockReturnValue(false);
            mockGetOSVersion.mockReturnValue("10.0.0");
            expectGetNewUpdate(
                availableVersionsWithNoMinimumOsVersion,
                {
                    localVersion: "1.0.0",
                    expectedVersion: "1.0.8",
                },
                true,
            );
        });

        it("allows update on Linux when no MinimumOsVersion exists", () => {
            mockIsMac.mockReturnValue(false);
            mockGetOSVersion.mockReturnValue("4.0.0");
            expectGetNewUpdate(
                availableVersionsWithNoMinimumOsVersion,
                {
                    localVersion: "1.0.0",
                    expectedVersion: "1.0.8",
                },
                true,
            );
        });
    });

    describe("edge cases", () => {
        beforeEach(() => {
            mockIsMac.mockReturnValue(true);
        });

        it("handles exact version match on boundary", () => {
            mockGetOSVersion.mockReturnValue("14.0.0");
            expectGetNewUpdate(
                availableVersionsWithMinimumOsVersion,
                {
                    localVersion: "1.0.0",
                    expectedVersion: "1.0.6",
                },
                true,
            );
        });

        it("handles version just below boundary", () => {
            mockGetOSVersion.mockReturnValue("13.9.9");
            expectGetNewUpdate(
                availableVersionsWithMinimumOsVersion,
                {
                    localVersion: "1.0.0",
                    expectedVersion: "1.0.6",
                },
                true,
            );
        });

        it("handles empty electron OS version", () => {
            mockGetOSVersion.mockReturnValue("");
            expectGetNewUpdate(
                availableVersionsWithMinimumOsVersion,
                {
                    localVersion: "1.0.0",
                    expectedVersion: "1.0.6",
                },
                true,
            );
        });

        it("handles malformed electron OS version", () => {
            mockGetOSVersion.mockReturnValue("13.99.99.99.99");
            expectGetNewUpdate(
                availableVersionsWithMinimumOsVersion,
                {
                    localVersion: "1.0.0",
                    expectedVersion: "1.0.6",
                },
                true,
            );
        });

        it("handles undefined MinimumOsVersion on macOS", () => {
            mockGetOSVersion.mockReturnValue("13.0.0");
            expectGetNewUpdate(
                availableVersionsWithNoMinimumOsVersion,
                {
                    localVersion: "1.0.0",
                    expectedVersion: "1.0.8",
                },
                true,
            );
        });
    });
});
