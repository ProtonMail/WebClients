import { trimLocalID, isGoogleOAuthAuthorizationURL, isBookingURL } from "./urlTests";
import * as urlStore from "../../store/urlStore";
import { GOOGLE_OAUTH_PATH } from "@proton/shared/lib/api/activation";

jest.mock("../config", () => {});

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

    describe("isGoogleOAuthAuthorizationURL", () => {
        beforeAll(() => {
            jest.spyOn(urlStore, "getAppURL").mockReturnValue({
                account: "https://account.proton.me",
                mail: "https://mail.proton.me",
                calendar: "https://calendar.proton.me",
            });
        });

        it("returns true for a valid Google OAuth URL", () => {
            const validURL = `https://account.proton.me${GOOGLE_OAUTH_PATH}?redirect_uri=https%3A%2F%2Faccount.proton.me%2Foauth%2Fcallback`;

            expect(isGoogleOAuthAuthorizationURL(validURL)).toBe(true);
        });

        it("returns false for a different account path", () => {
            const invalidURL = "https://account.proton.me/settings";

            expect(isGoogleOAuthAuthorizationURL(invalidURL)).toBe(false);
        });

        it("returns false for same path on wrong domain", () => {
            const wrongDomainURL = `https://calendar.proton.me${GOOGLE_OAUTH_PATH}?redirect_uri=https%3A%2F%2Faccount.proton.me%2Foauth%2Fcallback`;

            expect(isGoogleOAuthAuthorizationURL(wrongDomainURL)).toBe(false);
        });

        it("returns false for a malformed URL", () => {
            const invalidUrl = "invalid url";

            expect(isGoogleOAuthAuthorizationURL(invalidUrl)).toBe(false);
        });
    });

    describe("isBookingURL", () => {
        beforeAll(() => {
            jest.spyOn(urlStore, "getAppURL").mockReturnValue({
                account: "https://account.proton.me",
                mail: "https://mail.proton.me",
                calendar: "https://calendar.proton.me",
            });
        });

        it("returns true for bookings path", () => {
            expect(isBookingURL("https://calendar.proton.me/bookings")).toBe(true);
            expect(isBookingURL("https://calendar.proton.me/bookings#some-booking-id")).toBe(true);
            expect(isBookingURL("https://calendar.proton.me/bookings/guests#some-booking-id")).toBe(true);
            expect(isBookingURL("https://calendar.proton.me/u/0/bookings")).toBe(true);
            expect(isBookingURL("https://calendar.proton.me/u/1/bookings/")).toBe(true);
            expect(isBookingURL("https://calendar.proton.me/u/1/bookings#some-booking-id")).toBe(true);
        });

        it("returns false for non booking paths", () => {
            // Wrong app
            expect(isBookingURL("https://mail.proton.me/bookings")).toBe(false);
            expect(isBookingURL("https://account.proton.me/bookings")).toBe(false);

            // Not a booking url
            expect(isBookingURL("https://calendar.proton.me/settings")).toBe(false);
            expect(isBookingURL("https://calendar.proton.me/u/0/")).toBe(false);
            expect(isBookingURL("https://calendar.proton.me/u/0/week/2025/11/26")).toBe(false);

            // Standard link
            expect(isBookingURL("https://example.com")).toBe(false);

            // Invalid URLs
            expect(isBookingURL("invalid url")).toBe(false);
            expect(isBookingURL("not a url at all")).toBe(false);
        });
    });
});
