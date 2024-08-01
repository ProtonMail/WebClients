import { trimLocalID } from "./urlTests";

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
});
