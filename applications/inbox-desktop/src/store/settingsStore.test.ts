import { Singleton, getSingleton } from "../utils/testUtils";
import { saveSettings } from "./settingsStore";
import Store from "electron-store";

const MockedStore = Store as unknown as Singleton<{
    get: () => void;
    set: () => void;
}>;

jest.mock("electron-store", () =>
    getSingleton<(typeof MockedStore)["INSTANCE"]>(() => ({
        get: jest.fn(),
        set: jest.fn(),
    })),
);

describe("settingsStore", () => {
    describe("saveSettings", () => {
        it("should work", () => {
            saveSettings({
                spellChecker: true,
                overrideError: false,
                defaultMailto: true,
            });

            expect(MockedStore.INSTANCE.set).toHaveBeenCalledWith("settings", {
                spellChecker: true,
                overrideError: false,
                defaultMailto: true,
            });
        });
    });
});
