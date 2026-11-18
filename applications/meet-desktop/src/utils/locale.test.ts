import type { Mock } from "vitest";

vi.mock("electron", () => ({
    app: { getPreferredSystemLanguages: vi.fn() },
}));

vi.mock("../store/settingsStore", () => ({
    getSettings: vi.fn(),
    updateSettings: vi.fn(),
}));

const setup = async ({ savedLocale, systemLanguages }: { savedLocale?: string; systemLanguages: string[] }) => {
    vi.resetModules();

    const { app } = await import("electron");
    const settingsStore = await import("../store/settingsStore");
    (app.getPreferredSystemLanguages as Mock).mockReturnValue(systemLanguages);
    (settingsStore.getSettings as Mock).mockReturnValue({ overrideError: false, locale: savedLocale });

    const { c } = await import("ttag");
    const locale = await import("./locale");

    return { c, ...locale, updateSettings: settingsStore.updateSettings as Mock };
};

describe("locale", () => {
    it("starts in the language of the last session", async () => {
        const { getStartupLocaleCode } = await setup({ savedLocale: "fr_FR", systemLanguages: ["de-DE"] });

        expect(getStartupLocaleCode()).toBe("fr_FR");
    });

    it("starts in the closest system language when no session language was saved", async () => {
        const { getStartupLocaleCode } = await setup({ systemLanguages: ["de-AT"] });

        expect(getStartupLocaleCode()).toBe("de_DE");
    });

    it("starts in English when the system language has no translations", async () => {
        const { getStartupLocaleCode } = await setup({ systemLanguages: ["ja-JP"] });

        expect(getStartupLocaleCode()).toBe("en_US");
    });

    it("translates the app and saves the language when the session language changes", async () => {
        const { c, initializeLocale, setSessionLocale, updateSettings } = await setup({
            systemLanguages: ["en-US"],
        });
        await initializeLocale();

        expect(c("Screen share picker").t`Cancel`).toBe("Cancel");
        expect(await setSessionLocale("fr_FR")).toBe(true);
        expect(c("Screen share picker").t`Cancel`).toBe("Annuler");
        expect(updateSettings).toHaveBeenCalledWith({ locale: "fr_FR" });
    });

    it("does nothing when the session language is already applied", async () => {
        const { initializeLocale, setSessionLocale, updateSettings } = await setup({
            savedLocale: "fr_FR",
            systemLanguages: ["en-US"],
        });
        await initializeLocale();

        expect(await setSessionLocale("fr_FR")).toBe(false);
        expect(updateSettings).not.toHaveBeenCalled();
    });
});
