import { trimLocalID, isBookingURL } from "./urlTests";
import * as urlStore from "../../store/urlStore";

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
