import { describe } from "@jest/globals";
import { LogMessage } from "electron-log";
import { filterSensitiveLogMessageTestOnly } from "./index";
import { app } from "electron";

jest.mock("electron", () => ({
    app: {
        getPath: () => "/home/potato",
    },
}));

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
            "GET https://mail.proton.me/api/core/v4/keys/all?Email=__EMAIL__&InternalOnly=0 200 HTTP/1.1 200 OK",
        );

        expectFilterSensitiveString(
            "GET https://mail.proton.me/api/kt/v1/epochs/2831/proof?Identifier=somename%40pm.me&Revision=1 200 HTTP/1.1 200 OK",
            "GET https://mail.proton.me/api/kt/v1/epochs/2831/proof?Identifier=__EMAIL__&Revision=1 200 HTTP/1.1 200 OK",
        );

        expectFilterSensitiveString(
            "GET https://calendar.proton.me/api/calendar/v1/coworker@pm.me/busy-schedule?Start=1234&End=12783&Type=0&Timezone=Europe%2FNarnia 200 HTTP/1.1 200 OK",
            "GET https://calendar.proton.me/api/calendar/v1/__EMAIL__/busy-schedule?Start=__TIME__&End=__TIME__&Type=0&Timezone=__TIME__ 200 HTTP/1.1 200 OK",
        );
    });
    it("replaces time related data", () => {
        expectFilterSensitiveString(
            "https://calendar.proton.me/api/calendar/v1/some-calendar-id/events?Start=1728770400&End=1729375199&Timezone=Europe%2FNarnia&PageSize=100&Type=1&Page=0&MetaDataOnly=1 200 HTTP/1.1 200",
            "https://calendar.proton.me/api/calendar/v1/some-calendar-id/events?Start=__TIME__&End=__TIME__&Timezone=__TIME__&PageSize=100&Type=1&Page=0&MetaDataOnly=1 200 HTTP/1.1 200",
        );
    });
    it("replaces ids", () => {
        expectFilterSensitiveString(
            "https://account.proton.me/authorize?app=proton-mail&state=some-state-id&v=2&reason=session-expired",
            "https://account.proton.me/__FORBIDDEN__?app=proton-mail&state=__ID__&v=2&reason=session-expired",
        );
        expectFilterSensitiveString(
            "https://mail.proton.me/login#selector=some-selector-id&state=some-state-id&sk=some-sk-id&v=2&p=1&tr=1&pv=1&pt=default",
            "https://mail.proton.me/login#selector=__ID__&state=__ID__&sk=__ID__&v=2&p=1&tr=1&pv=1&pt=default",
        );
    });
    it("replaces home directories in absolute paths", () => {
        expectFilterSensitiveString(
            `App start is mac: true is windows: false islinux: false version: 1.3.0 params [
              ${app.getPath("home")}/proton-clients/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron,
              .
            ]`,
            "App start is mac: true is windows: false islinux: false version: 1.3.0 params [ __HOME__/proton-clients/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron, . ]",
        );
        expectFilterSensitiveString(
            `did-navigate file://${app.getPath("home")}/path/to/proton/app/assets/loading.html?message=Loading%20Proton%20Mail%E2%80%A6&theme=light`,
            "did-navigate file:///__HOME__/path/to/proton/app/assets/loading.html?message=Loading%20Proton%20Mail%E2%80%A6&theme=light",
        );
    });
});
