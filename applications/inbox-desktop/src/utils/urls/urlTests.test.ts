import { isCalendarCreateBookingURL, isHostAllowed, isSameURL, isURLAllowed, trimLocalID } from "./urlTests";

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

    describe("isURLAllowed", () => {
        it("should allow https app URLs", () => {
            expect(isURLAllowed("https://mail.proton.me/u/0/inbox")).toBe(true);
            expect(isURLAllowed("https://account.proton.me")).toBe(true);
        });

        it("should not allow other schemes pointing at an app host", () => {
            expect(isURLAllowed("evilapp:payload@mail.proton.me")).toBe(false);
            expect(isURLAllowed("mailto:x@mail.proton.me")).toBe(false);
            expect(isURLAllowed("evilapp://mail.proton.me/x")).toBe(false);
            expect(isURLAllowed("http://mail.proton.me")).toBe(false);
        });

        it("should compare the normalised host", () => {
            expect(isURLAllowed("https://MAIL.PROTON.ME/")).toBe(true);
            expect(isURLAllowed("https://mail.proton.me:443/")).toBe(true);
            expect(isURLAllowed("https://mail.proton.me./")).toBe(false);
        });

        it("should not allow credentials in app URLs", () => {
            expect(isURLAllowed("https://user:pass@mail.proton.me/")).toBe(false);
            expect(isURLAllowed("https://user@mail.proton.me/")).toBe(false);
        });

        it("should not allow unrelated hosts", () => {
            expect(isURLAllowed("https://evil.com/")).toBe(false);
            expect(isURLAllowed("https://mail.proton.me.evil.com/")).toBe(false);
        });

        it("should not throw on data or invalid URLs", () => {
            expect(isURLAllowed("data:text/html,<h1>x</h1>")).toBe(false);
            expect(isURLAllowed("not a url")).toBe(false);
        });
    });

    describe("isHostAllowed", () => {
        it("should allow app hosts", () => {
            expect(isHostAllowed("mail.proton.me")).toBe(true);
            expect(isHostAllowed("calendar.proton.me")).toBe(true);
        });

        it("should not allow app hosts with a different port", () => {
            expect(isHostAllowed("mail.proton.me:8080")).toBe(false);
        });

        it("should not allow unrelated hosts or URL-like input", () => {
            expect(isHostAllowed("evil.com")).toBe(false);
            expect(isHostAllowed("evilapp:payload@mail.proton.me")).toBe(false);
            expect(isHostAllowed("https://mail.proton.me")).toBe(false);
        });
    });
});
