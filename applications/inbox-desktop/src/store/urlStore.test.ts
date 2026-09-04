const mockStoreGet = jest.fn();
const mockApp = { isPackaged: true };

jest.mock("electron", () => ({
    app: mockApp,
}));

jest.mock("electron-store", () => {
    return jest.fn().mockImplementation(() => ({
        get: mockStoreGet,
    }));
});

jest.mock("./settingsStore", () => ({
    updateSettings: jest.fn(),
}));

jest.mock("../utils/log", () => ({
    mainLogger: { error: jest.fn() },
}));

describe("getAppURL / overrideURL validation", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockApp.isPackaged = true;
        delete process.env.BASE_LOCAL_URL;
    });

    function getAppURLWithOverride(overrideURL: unknown) {
        mockStoreGet.mockReturnValue(overrideURL);
        jest.resetModules();
        mockStoreGet.mockReturnValue(overrideURL);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getAppURL } = require("./urlStore");
        return getAppURL();
    }

    const legitimateOverrides = [
        {
            name: "proton.black",
            value: {
                account: "https://account.proton.black",
                mail: "https://mail.proton.black",
                calendar: "https://calendar.proton.black",
            },
        },
        {
            name: "proton.pink",
            value: {
                account: "https://account.proton.pink",
                mail: "https://mail.proton.pink",
                calendar: "https://calendar.proton.pink",
            },
        },
        {
            name: "custom scientist subdomain on proton.black",
            value: {
                account: "https://account.my-scientist-env.proton.black",
                mail: "https://mail.my-scientist-env.proton.black",
                calendar: "https://calendar.my-scientist-env.proton.black",
            },
        },
        {
            name: "custom scientist subdomain on proton.pink",
            value: {
                account: "https://account.my-scientist-env.proton.pink",
                mail: "https://mail.my-scientist-env.proton.pink",
                calendar: "https://calendar.my-scientist-env.proton.pink",
            },
        },
        {
            name: "proton.dev with a port",
            value: {
                account: "https://account.proton.dev:8080",
                mail: "https://mail.proton.dev:8080",
                calendar: "https://calendar.proton.dev:8080",
            },
        },
        {
            name: "proton.me",
            value: {
                account: "https://account.proton.me",
                mail: "https://mail.proton.me",
                calendar: "https://calendar.proton.me",
            },
        },
    ];

    test.each(legitimateOverrides)("accepts $name", ({ value }) => {
        expect(getAppURLWithOverride(value)).toEqual(value);
    });

    const maliciousOverrides = [
        {
            name: "substring-anywhere bypass (the reported exploit)",
            value: {
                account: "https://account.proton.me",
                mail: "http://attacker.com/mail-proton-anything",
                calendar: "https://calendar.proton.me",
            },
        },
        {
            name: "no dot boundary before proton.me",
            value: {
                account: "https://accountproton.me",
                mail: "https://mail.proton.me",
                calendar: "https://calendar.proton.me",
            },
        },
        {
            name: "suffix confusion via trailing extra labels",
            value: {
                account: "https://account.proton.me",
                mail: "https://mail.proton.me.attacker.com",
                calendar: "https://calendar.proton.me",
            },
        },
        {
            name: "query-string substring bypass",
            value: {
                account: "https://account.proton.me",
                mail: "https://mail.attacker.com/?x=proton",
                calendar: "https://calendar.proton.me",
            },
        },
        {
            name: "http (non-https) scheme",
            value: {
                account: "http://account.proton.black",
                mail: "https://mail.proton.black",
                calendar: "https://calendar.proton.black",
            },
        },
        {
            name: "trailing slash",
            value: {
                account: "https://account.proton.me/",
                mail: "https://mail.proton.me",
                calendar: "https://calendar.proton.me",
            },
        },
        {
            name: "mismatched view label",
            value: {
                account: "https://account.proton.me",
                mail: "https://account.proton.black",
                calendar: "https://calendar.proton.me",
            },
        },
    ];

    test.each(maliciousOverrides)("rejects $name and falls back to defaultAppURL", ({ value }) => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { defaultAppURL } = require("./urlStore");
        expect(getAppURLWithOverride(value)).toEqual(defaultAppURL);
    });
});

describe("getAppURL / BASE_LOCAL_URL gating", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockApp.isPackaged = true;
        delete process.env.BASE_LOCAL_URL;
    });

    afterEach(() => {
        delete process.env.BASE_LOCAL_URL;
        delete process.env.PLAYWRIGHT_TEST;
    });

    function getAppURLWithLocalEnv(isPackaged: boolean, baseLocalUrl: string, playwrightTest = false) {
        mockApp.isPackaged = isPackaged;
        process.env.BASE_LOCAL_URL = baseLocalUrl;
        if (playwrightTest) {
            process.env.PLAYWRIGHT_TEST = "true";
        } else {
            delete process.env.PLAYWRIGHT_TEST;
        }
        mockStoreGet.mockReturnValue(undefined);
        jest.resetModules();
        mockApp.isPackaged = isPackaged;
        mockStoreGet.mockReturnValue(undefined);
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getAppURL } = require("./urlStore");
        return getAppURL();
    }

    test("ignores BASE_LOCAL_URL in a packaged build, even when an attacker sets it", () => {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { defaultAppURL } = require("./urlStore");
        expect(getAppURLWithLocalEnv(true, "attacker.com")).toEqual(defaultAppURL);
    });

    test("honors BASE_LOCAL_URL in a packaged playwright test build", () => {
        expect(getAppURLWithLocalEnv(true, "hutton.proton.black", true)).toEqual({
            account: "https://account.hutton.proton.black",
            mail: "https://mail.hutton.proton.black",
            calendar: "https://calendar.hutton.proton.black",
        });
    });

    test("honors BASE_LOCAL_URL in an unpackaged (dev) build", () => {
        expect(getAppURLWithLocalEnv(false, "proton.dev:8443")).toEqual({
            account: "https://account.proton.dev:8443",
            mail: "https://mail.proton.dev:8443",
            calendar: "https://calendar.proton.dev:8443",
        });
    });
});
