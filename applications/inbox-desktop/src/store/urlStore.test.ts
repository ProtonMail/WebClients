const { mockStoreGet, mockApp } = vi.hoisted(() => ({
    mockStoreGet: vi.fn(),
    mockApp: { isPackaged: true },
}));

vi.mock("electron", () => ({
    app: mockApp,
}));

vi.mock("./safeStore/safeStore", () => ({
    SafeStore: vi.fn(function () {
        return { get: mockStoreGet };
    }),
}));

vi.mock("./settingsStore", () => ({
    updateSettings: vi.fn(),
}));

vi.mock("../utils/log", () => ({
    mainLogger: { error: vi.fn() },
}));

describe("getAppURL / overrideURL validation", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockApp.isPackaged = true;
        delete process.env.BASE_LOCAL_URL;
    });

    async function getAppURLWithOverride(overrideURL: unknown) {
        mockStoreGet.mockReturnValue(overrideURL);
        vi.resetModules();
        mockStoreGet.mockReturnValue(overrideURL);
        const { getAppURL } = await import("./urlStore");
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

    test.each(legitimateOverrides)("accepts $name", async ({ value }) => {
        expect(await getAppURLWithOverride(value)).toEqual(value);
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

    test.each(maliciousOverrides)("rejects $name and falls back to defaultAppURL", async ({ value }) => {
        const { defaultAppURL } = await import("./urlStore");
        expect(await getAppURLWithOverride(value)).toEqual(defaultAppURL);
    });
});

describe("getAppURL / BASE_LOCAL_URL gating", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockApp.isPackaged = true;
        delete process.env.BASE_LOCAL_URL;
    });

    afterEach(() => {
        delete process.env.BASE_LOCAL_URL;
        delete process.env.PLAYWRIGHT_TEST;
    });

    async function getAppURLWithLocalEnv(isPackaged: boolean, baseLocalUrl: string, playwrightTest = false) {
        mockApp.isPackaged = isPackaged;
        process.env.BASE_LOCAL_URL = baseLocalUrl;
        if (playwrightTest) {
            process.env.PLAYWRIGHT_TEST = "true";
        } else {
            delete process.env.PLAYWRIGHT_TEST;
        }
        mockStoreGet.mockReturnValue(undefined);
        vi.resetModules();
        mockApp.isPackaged = isPackaged;
        mockStoreGet.mockReturnValue(undefined);
        const { getAppURL } = await import("./urlStore");
        return getAppURL();
    }

    test("ignores BASE_LOCAL_URL in a packaged build, even when an attacker sets it", async () => {
        const { defaultAppURL } = await import("./urlStore");
        expect(await getAppURLWithLocalEnv(true, "attacker.com")).toEqual(defaultAppURL);
    });

    test("honors BASE_LOCAL_URL in a packaged playwright test build", async () => {
        expect(await getAppURLWithLocalEnv(true, "hutton.proton.black", true)).toEqual({
            account: "https://account.hutton.proton.black",
            mail: "https://mail.hutton.proton.black",
            calendar: "https://calendar.hutton.proton.black",
        });
    });

    test("honors BASE_LOCAL_URL in an unpackaged (dev) build", async () => {
        expect(await getAppURLWithLocalEnv(false, "proton.dev:8443")).toEqual({
            account: "https://account.proton.dev:8443",
            mail: "https://mail.proton.dev:8443",
            calendar: "https://calendar.proton.dev:8443",
        });
    });
});
