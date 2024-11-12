import { MockedStore } from "../utils/testUtils";
import { updateSettings } from "./settingsStore";

describe("settingsStore", () => {
    describe("updateSettings", () => {
        it("should work", () => {
            updateSettings({
                spellChecker: false,
                overrideError: true,
            });

            expect(MockedStore.INSTANCE.set).toHaveBeenCalledWith(
                "settings",
                expect.objectContaining({
                    spellChecker: false,
                    overrideError: true,
                }),
            );
        });

        it("should not be called if settings didn't change", () => {
            updateSettings({
                spellChecker: true,
                overrideError: false,
            });

            expect(MockedStore.INSTANCE.set).not.toHaveBeenCalled();
        });
    });
});
