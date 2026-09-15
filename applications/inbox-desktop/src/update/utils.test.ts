import { RELEASE_CATEGORIES } from "@proton/shared/lib/constants";
import * as updateUtils from "./utils";

describe("isReleaseCategorySatisfied", () => {
    describe.each([
        [RELEASE_CATEGORIES.STABLE, RELEASE_CATEGORIES.STABLE, true],
        [RELEASE_CATEGORIES.STABLE, RELEASE_CATEGORIES.EARLY_ACCESS, false],
        [RELEASE_CATEGORIES.STABLE, RELEASE_CATEGORIES.ALPHA, false],

        [RELEASE_CATEGORIES.EARLY_ACCESS, RELEASE_CATEGORIES.STABLE, true],
        [RELEASE_CATEGORIES.EARLY_ACCESS, RELEASE_CATEGORIES.EARLY_ACCESS, true],
        [RELEASE_CATEGORIES.EARLY_ACCESS, RELEASE_CATEGORIES.ALPHA, false],

        [RELEASE_CATEGORIES.ALPHA, RELEASE_CATEGORIES.STABLE, true],
        [RELEASE_CATEGORIES.ALPHA, RELEASE_CATEGORIES.EARLY_ACCESS, true],
        [RELEASE_CATEGORIES.ALPHA, RELEASE_CATEGORIES.ALPHA, true],
    ])("local=%s candidate=%s", (local, candidate, expected) => {
        it(`returns ${expected}`, () => {
            expect(updateUtils.isReleaseCategorySatisfied(local, candidate)).toBe(expected);
        });
    });

    it("returns false for unknown local category", () => {
        expect(updateUtils.isReleaseCategorySatisfied("Unknown", RELEASE_CATEGORIES.STABLE)).toBe(false);
    });

    it("returns false for unknown candidate category", () => {
        expect(updateUtils.isReleaseCategorySatisfied(RELEASE_CATEGORIES.STABLE, "Unknown")).toBe(false);
    });
});

describe("getVersionManifestFetchJitterMs", () => {
    it("returns an integer within the expected range", () => {
        for (let i = 0; i < 50; i++) {
            const jitter = updateUtils.getVersionManifestFetchJitterMs();
            expect(Number.isInteger(jitter)).toBe(true);
            expect(jitter).toBeGreaterThanOrEqual(900_000);
            expect(jitter).toBeLessThanOrEqual(2_700_000);
        }
    });
});

describe("getElectronUpdaterFetchInterval", () => {
    it("returns a string ending with ' min'", () => {
        const interval = updateUtils.getElectronUpdaterFetchInterval();
        expect(interval).toMatch(/^\d+ min$/);
    });

    it("returns an integer interval between 10 and 30 minutes", () => {
        for (let i = 0; i < 50; i++) {
            const interval = updateUtils.getElectronUpdaterFetchInterval();
            const minutes = parseFloat(interval);
            expect(Number.isInteger(minutes)).toBe(true);
            expect(minutes).toBeGreaterThanOrEqual(10);
            expect(minutes).toBeLessThanOrEqual(30);
        }
    });
});
