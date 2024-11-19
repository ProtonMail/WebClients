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

describe("filter sensitve data", () => {
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
        getPathMock.mockImplementation(() => "c:\\Users\\myuser\\proton-clients\\electron\\electron.exe");

        expectFilterSensitiveString(
            `App start is mac: true is windows: false islinux: false version: 1.3.0 params [ ${app.getPath("home")}\\proton-clients\\electron\\electron.exe ]`,
            "App start is mac: true is windows: false islinux: false version: 1.3.0 params [ /__HOME_NONASCII_18f6fe10c8813681718b6a998fa139ffd9891955__/proton-clients/electron/electron.exe ]",
        );
    });
});
