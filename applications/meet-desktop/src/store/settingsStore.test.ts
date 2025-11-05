import { RELEASE_CATEGORIES } from "@proton/shared/lib/constants";
import { MockedStore } from "../utils/tests/electronStoreMock";
import { getSettings, updateSettings } from "./settingsStore";

describe("settingsStore", () => {
    describe("updateSettings", () => {
        it("should work", () => {
            updateSettings({
                overrideError: true,
            });

            expect(MockedStore.INSTANCE.set).toHaveBeenCalledWith(
                "settings",
                expect.objectContaining({
                    overrideError: true,
                }),
            );
        });

        it("should not be called if settings didn't change", () => {
            MockedStore.INSTANCE.get.mockReturnValue({
                overrideError: false,
                releaseCategory: RELEASE_CATEGORIES.STABLE,
                rolloutProportion: -1,
            });

            updateSettings({
                overrideError: false,
            });

            expect(MockedStore.INSTANCE.set).not.toHaveBeenCalled();
        });
    });

    describe("getSettings", () => {
        it("should update settings automatically if releaseCategory is missing", () => {
            MockedStore.INSTANCE.get.mockReturnValue({
                overrideError: false,
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
