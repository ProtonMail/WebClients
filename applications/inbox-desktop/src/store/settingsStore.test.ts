import { MockedStore } from "../utils/testUtils";
import { saveSettings } from "./settingsStore";

describe("settingsStore", () => {
    describe("saveSettings", () => {
        it("should work", () => {
            saveSettings({
                spellChecker: true,
                overrideError: false,
            });

            expect(MockedStore.INSTANCE.set).toHaveBeenCalledWith("settings", {
                spellChecker: true,
                overrideError: false,
            });
        });
    });
});
