import { isCalendarCreateBookingURL, isSameURL, trimLocalID } from "./urlTests";

jest.mock("../config", () => {});

jest.mock("../../store/urlStore", () => ({
    getAppURL: () => ({
        account: "https://account.proton.me",
        mail: "https://mail.proton.me",
        calendar: "https://calendar.proton.me",
    }),
}));

describe("urlTests", () => {
    describe("trimLocalID", () => {
        it("should keep urls without localID as they are", () => {
            expect(trimLocalID("https://example.local")).toBe("https://example.local/");
            expect(trimLocalID("https://example.local/some/path")).toBe("https://example.local/some/path");
            expect(trimLocalID("https://example.local/u/potato/")).toBe("https://example.local/u/potato/");
        });

        it("should remove localID from urls", () => {
            expect(trimLocalID("https://example.local/u/123")).toBe("https://example.local/");
            expect(trimLocalID("https://example.local/u/123/")).toBe("https://example.local/");
            expect(trimLocalID("https://example.local/u/456/potato")).toBe("https://example.local/potato");
            expect(trimLocalID("https://example.local/u/7/tomato/")).toBe("https://example.local/tomato/");
        });
    });

    describe("isCalendarCreateBookingURL", () => {
        it("should match the Calendar create booking URL", () => {
            expect(isCalendarCreateBookingURL("https://calendar.proton.me/u/0/?action=create-booking")).toBe(true);
            expect(isCalendarCreateBookingURL("https://calendar.proton.me/u/3?action=create-booking")).toBe(true);
        });

        it("should not match other Calendar URLs", () => {
            expect(isCalendarCreateBookingURL("https://calendar.proton.me/u/0/")).toBe(false);
            expect(isCalendarCreateBookingURL("https://calendar.proton.me/u/0/?action=other")).toBe(false);
        });

        it("should not match the action on other apps", () => {
            expect(isCalendarCreateBookingURL("https://mail.proton.me/u/0/?action=create-booking")).toBe(false);
        });

        it("should not throw on invalid URLs", () => {
            expect(isCalendarCreateBookingURL("not a url")).toBe(false);
        });

        it("should be treated as the same home page by isSameURL, which is why it needs its own check", () => {
            expect(
                isSameURL("https://calendar.proton.me/u/0/?action=create-booking", "https://calendar.proton.me/u/0/"),
            ).toBe(true);
        });
    });
});
