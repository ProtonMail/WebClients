import { MockedStore } from "../utils/tests/electronStoreMock";
import { getSettings, updateSettings } from "./settingsStore";

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

    describe("getSettings", () => {
        it("should update settings automatically if releaseCategory is missing", () => {
            MockedStore.INSTANCE.get.mockReturnValue({
                overrideError: false,
                spellChecker: false,
            });

            getSettings();

            expect(MockedStore.INSTANCE.set).toHaveBeenCalledWith(
                "settings",
                expect.objectContaining({
                    releaseCategory: expect.any(String),
                }),
            );
        });

        it("should update settings automatically if rolloutProportion is missing", () => {
            MockedStore.INSTANCE.get.mockReturnValue({
                overrideError: false,
                spellChecker: false,
            });

            getSettings();

            expect(MockedStore.INSTANCE.set).toHaveBeenCalledWith(
                "settings",
                expect.objectContaining({
                    rolloutProportion: expect.any(Number),
                }),
            );
        });
    });
});
