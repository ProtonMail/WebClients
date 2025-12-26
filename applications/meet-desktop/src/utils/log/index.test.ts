import { describe } from "@jest/globals";
import { LogMessage } from "electron-log";
import { filterSensitiveLogMessageTestOnly } from "./index";
import { app } from "electron";

jest.mock("electron", () => ({
    app: {
        getPath: jest.fn(() => "/home/potato"),
    },
}));

const getPathMock = app.getPath as unknown as jest.Mock;

const expectFilterSensitiveString = (given: string, want: string) => {
    const givenLogMessage: LogMessage = {
        data: [given],
        date: new Date(),
        level: "error",
    };
    const wantLogMessage: LogMessage = {
        ...givenLogMessage,
        data: [want],
    };
    expect(filterSensitiveLogMessageTestOnly(givenLogMessage)).toEqual(wantLogMessage);
};

const expectFilterStringIsSame = (givenAndWant: string) => expectFilterSensitiveString(givenAndWant, givenAndWant);

describe("filter sensitive data", () => {
    it("does not change ok stuff", () => {
        expectFilterStringIsSame("This is OK");
        expectFilterStringIsSame("Some Email without=&");
    });
    it("it replaces email", () => {
        expectFilterSensitiveString(
            "GET https://mail.proton.me/api/core/v4/keys/all?Email=somename%40pm.me&InternalOnly=0 200 HTTP/1.1 200 OK",
            "GET https://mail.proton.me/api/core/v4/keys/all?Email=__EMAIL_PROTON__&InternalOnly=0 200 HTTP/1.1 200 OK",
        );

        expectFilterSensitiveString(
            "GET https://mail.proton.me/api/kt/v1/epochs/2831/proof?Identifier=somename%40mydomain.com&Revision=1 200 HTTP/1.1 200 OK",
            "GET https://mail.proton.me/api/kt/v1/epochs/2831/proof?Identifier=__EMAIL_NONPROTON__&Revision=1 200 HTTP/1.1 200 OK",
        );

        expectFilterSensitiveString(
            "GET https://calendar.proton.me/api/calendar/v1/coworker@pm.me/busy-schedule?Start=1234&End=12783&Type=0&Timezone=Europe%2FNarnia 200 HTTP/1.1 200 OK",
            "GET https://calendar.proton.me/api/calendar/v1/__EMAIL_PROTON__/busy-schedule?Start=1234&End=12783&Type=0&Timezone=Europe%2FNarnia 200 HTTP/1.1 200 OK",
        );
    });
    it("replaces email domains", () => {
        expectFilterSensitiveString(
            "[2024-11-19 09:43:54.034] [verbose] (net/mail)     GET https://mail.proton.me/api/kt/v1/epochs/3017/proof?Identifier=%40gmail.com&Revision=1 200 HTTP/1.1 200",
            "[2024-11-19 09:43:54.034] [verbose] (net/mail) GET https://mail.proton.me/api/kt/v1/epochs/3017/proof?Identifier=__EMAIL_NONPROTON__&Revision=1 200 HTTP/1.1 200",
        );
    });
    it("does not replace time related data", () => {
        expectFilterSensitiveString(
            "https://calendar.proton.me/api/calendar/v1/some-calendar-id/events?Start=1728770400&End=1729375199&Timezone=Europe%2FNarnia&PageSize=100&Type=1&Page=0&MetaDataOnly=1 200 HTTP/1.1 200",
            "https://calendar.proton.me/api/calendar/v1/some-calendar-id/events?Start=1728770400&End=1729375199&Timezone=Europe%2FNarnia&PageSize=100&Type=1&Page=0&MetaDataOnly=1 200 HTTP/1.1 200",
        );
    });
    it("replaces some ids", () => {
        expectFilterSensitiveString(
            "https://account.proton.me/authorize?app=proton-mail&state=some-state-id&v=2&reason=session-expired",
            "https://account.proton.me/__FORBIDDEN__?app=proton-mail&state=some-state-id&v=2&reason=session-expired",
        );
        expectFilterSensitiveString(
            "https://mail.proton.me/login#selector=some-selector-id&state=some-state-id&sk=some-sk-id&v=2&p=1&tr=1&pv=1&pt=default",
            "https://mail.proton.me/login#selector=some-selector-id&state=some-state-id&sk=some-sk-id&v=2&p=1&tr=1&pv=1&pt=default",
        );
        expectFilterSensitiveString(
            "https://mail.proton.me/login#selector=some-selector-id&state=some-state-id&sentry_key=some-sk-id&v=2&p=1&tr=1&pv=1&pt=default",
            "https://mail.proton.me/login#selector=some-selector-id&state=some-state-id&sentry_key=__ID__&v=2&p=1&tr=1&pv=1&pt=default",
        );
    });
    it("replaces home directories in absolute paths", () => {
        expectFilterSensitiveString(
            `App start is mac: true is windows: false islinux: false version: 1.3.0 params [
              ${app.getPath("home")}/proton-clients/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron,
              .
            ]`,
            "App start is mac: true is windows: false islinux: false version: 1.3.0 params [ /__HOME_ASCII_bfe956da5d2f2d74160956576cde148907b75ecd__/proton-clients/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron, . ]",
        );
        expectFilterSensitiveString(
            `did-navigate file://${app.getPath("home")}/path/to/proton/app/assets/loading.html?message=Loading%20Proton%20Mail%E2%80%A6&theme=light`,
            "did-navigate file:///__HOME_ASCII_bfe956da5d2f2d74160956576cde148907b75ecd__/path/to/proton/app/assets/loading.html?message=Loading%20Proton%20Mail%E2%80%A6&theme=light",
        );
    });
    it("checks home paths with spaces", () => {
        getPathMock.mockImplementation(() => "/home/Super Person");

        expectFilterSensitiveString(
            `App start is mac: true is windows: false islinux: false version: 1.3.0 params [
              ${app.getPath("home")}/proton-clients/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron,
              .
            ]`,
            "App start is mac: true is windows: false islinux: false version: 1.3.0 params [ /__HOME_ASCII_a72145d9229b7ac0553c5e5bba758e41da15e6c7__/proton-clients/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron, . ]",
        );
    });
    it("checks non-ascii home directories", () => {
        getPathMock.mockImplementation(() => "/home/The 💃 Fantastic 🤖");

        expectFilterSensitiveString(
            `App start is mac: true is windows: false islinux: false version: 1.3.0 params [
              ${app.getPath("home")}/proton-clients/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron,
              .
            ]`,
            "App start is mac: true is windows: false islinux: false version: 1.3.0 params [ /__HOME_NONASCII_d697420347b07c89e21463ed5b7d666619a78674__/proton-clients/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron, . ]",
        );
    });
    it("works with windows paths", () => {
        getPathMock.mockImplementation(() => "c:\\Users\\myuser");

        expectFilterSensitiveString(
            `App start is mac: true is windows: false islinux: false version: 1.3.0 params [ ${app.getPath("home")}\\proton-clients\\electron\\electron.exe ]`,
            "App start is mac: true is windows: false islinux: false version: 1.3.0 params [ /__HOME_ASCII_31d885743576198201e85d27db5525e13819608e__/proton-clients/electron/electron.exe ]",
        );

        getPathMock.mockImplementation(() => "C:\\Users\\Nice Human");

        expectFilterSensitiveString(
            `[2024-11-19 10:08:49.760] [info]  (calendar)     loadURL from file:///${encodeURI(app.getPath("home"))}/AppData/Local/proton_mail/app-1.3.1/resources/loading.html?message=Loading%20Proton%20Calendar%E2%80%A6&theme=dark to https://calendar.proton.me/u/0/`,
            "[2024-11-19 10:08:49.760] [info] (calendar) loadURL from file:////__HOME_ASCII_e698c2b73ce60bbf090ba91febe82dba74758b2e__/AppData/Local/proton_mail/app-1.3.1/resources/loading.html?message=Loading%20Proton%20Calendar%E2%80%A6&theme=dark to https://calendar.proton.me/u/0/",
        );

        getPathMock.mockImplementation(() => "C:\\Users\\Mr. Moustache 🥸");

        expectFilterSensitiveString(
            `[2024-11-19 10:08:49.760] [info]  (calendar)     loadURL from file:///${encodeURI(app.getPath("home"))}/AppData/Local/proton_mail/app-1.3.1/resources/loading.html?message=Loading%20Proton%20Calendar%E2%80%A6&theme=dark to https://calendar.proton.me/u/0/`,
            "[2024-11-19 10:08:49.760] [info] (calendar) loadURL from file:////__HOME_NONASCII_8889dffe3531b138c1c6dad2f4fba23da5f8765c__/AppData/Local/proton_mail/app-1.3.1/resources/loading.html?message=Loading%20Proton%20Calendar%E2%80%A6&theme=dark to https://calendar.proton.me/u/0/",
        );
    });

    it("should not include meeting password in logs", () => {
        expectFilterSensitiveString(
            "https://meet.proton.me/u/1/join/id-ABCDEFGHIJKL#pwd-meetpass123",
            "https://meet.proton.me/u/1/join/id-ABCDEFGHIJKL#__FORBIDDEN__=",
        );
    });

    it("filters sensitive data in object data field", () => {
        getPathMock.mockImplementation(() => "C:\\Users\\UserTest");

        const givenLogMessage = {
            data: {
                id: 3,
                url: `file:///C:/Users/UserTest/AppData/Local/proton_meet/app-1.0.3/resources/loading.html?message=Loading Proton Account…&color=%237A6E80&backgroundColor=%2316141c`,
            },
            date: new Date(),
            level: "info" as const,
        } as unknown as LogMessage;

        const result = filterSensitiveLogMessageTestOnly(givenLogMessage);

        expect(result).not.toBe(false);
        expect(typeof result).toBe("object");

        const resultMessage = result as LogMessage;
        const resultData = resultMessage.data as unknown as { id: number; url: string };
        expect(resultData.id).toBe(3);
        expect(resultData.url).toContain("__HOME_ASCII_");
        expect(resultData.url).not.toContain("UserTest");
        expect(resultData.url).toContain("file:///");
        expect(resultData.url).toContain("/AppData/Local/proton_meet/app-1.0.3/resources/loading.html");
    });

    it("filters nested objects", () => {
        getPathMock.mockImplementation(() => "/home/user");

        const givenLogMessage = {
            data: {
                user: {
                    name: "John",
                    path: "/home/user/documents/file.txt",
                },
                metadata: {
                    timestamp: 1234567890,
                    location: "/home/user/app/data",
                },
            },
            date: new Date(),
            level: "info" as const,
        } as unknown as LogMessage;

        const result = filterSensitiveLogMessageTestOnly(givenLogMessage);
        const resultMessage = result as LogMessage;
        const resultData = resultMessage.data as unknown as {
            user: { name: string; email: string; path: string };
            metadata: { timestamp: number; location: string };
        };

        expect(resultData.user.name).toBe("John");
        expect(resultData.user.path).toContain("__HOME_ASCII_");
        expect(resultData.metadata.location).toContain("__HOME_ASCII_");
    });

    it("filters objects within arrays", () => {
        getPathMock.mockImplementation(() => "/home/test");

        const givenLogMessage = {
            data: [{ id: 1, url: "file:///home/test/file1.txt" }, "plain string"],
            date: new Date(),
            level: "info" as const,
        } as unknown as LogMessage;

        const result = filterSensitiveLogMessageTestOnly(givenLogMessage);
        const resultMessage = result as LogMessage;
        const resultData = resultMessage.data as unknown as Array<{ id: number; url: string; email: string } | string>;

        expect(Array.isArray(resultData)).toBe(true);
        expect((resultData[0] as { url: string }).url).toContain("__HOME_ASCII_");
        expect(resultData[1]).toBe("plain string");
    });

    it("filters arrays within objects", () => {
        getPathMock.mockImplementation(() => "/home/user");

        const givenLogMessage = {
            data: {
                files: ["/home/user/file1.txt", "/home/user/file2.txt"],
                metadata: {
                    paths: ["/home/user/data", "/home/user/cache"],
                },
            },
            date: new Date(),
            level: "info" as const,
        } as unknown as LogMessage;

        const result = filterSensitiveLogMessageTestOnly(givenLogMessage);
        const resultMessage = result as LogMessage;
        const resultData = resultMessage.data as unknown as {
            files: string[];
            metadata: { paths: string[] };
        };

        expect(resultData.files[0]).toContain("__HOME_ASCII_");
        expect(resultData.files[1]).toContain("__HOME_ASCII_");
        expect(resultData.metadata.paths[0]).toContain("__HOME_ASCII_");
    });

    it("preserves non-string values in objects", () => {
        getPathMock.mockImplementation(() => "/home/user");

        const givenLogMessage = {
            data: {
                id: 123,
                active: true,
                count: null,
                items: [1, 2, 3],
                nested: {
                    number: 456,
                    boolean: false,
                },
            },
            date: new Date(),
            level: "info" as const,
        } as unknown as LogMessage;

        const result = filterSensitiveLogMessageTestOnly(givenLogMessage);
        const resultMessage = result as LogMessage;
        const resultData = resultMessage.data as unknown as {
            id: number;
            active: boolean;
            count: null;
            items: number[];
            nested: { number: number; boolean: boolean };
        };

        expect(resultData.id).toBe(123);
        expect(resultData.active).toBe(true);
        expect(resultData.count).toBe(null);
        expect(resultData.items).toEqual([1, 2, 3]);
        expect(resultData.nested.number).toBe(456);
        expect(resultData.nested.boolean).toBe(false);
    });

    it("filters complex nested structures", () => {
        getPathMock.mockImplementation(() => "C:\\Users\\TestUser");

        const givenLogMessage = {
            data: {
                events: [
                    {
                        type: "navigate",
                        url: "file:///C:/Users/TestUser/app/index.html",
                    },
                    {
                        type: "error",
                        message: "Error in /C:/Users/TestUser/app/script.js",
                    },
                ],
                config: {
                    paths: {
                        data: "file:///C:\\Users\\TestUser\\data",
                        cache: "file:///C:\\Users\\TestUser\\cache",
                    },
                },
            },
            date: new Date(),
            level: "error" as const,
        } as unknown as LogMessage;

        const result = filterSensitiveLogMessageTestOnly(givenLogMessage);
        const resultMessage = result as LogMessage;
        const resultData = resultMessage.data as unknown as {
            events: Array<{
                type: string;
                url?: string;
                message?: string;
                user?: { home: string };
            }>;
            config: { paths: { data: string; cache: string } };
        };

        expect(resultData.events[0].url).toContain("__HOME_ASCII_");
        expect(resultData.events[0].url).not.toContain("TestUser");
        expect(resultData.events[1].message).toContain("__HOME_ASCII_");
        expect(resultData.config.paths.data).toContain("__HOME_ASCII_");
        expect(resultData.config.paths.cache).toContain("__HOME_ASCII_");
    });
});
