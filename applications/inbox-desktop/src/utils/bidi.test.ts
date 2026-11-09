import { stripBidiControls } from "./bidi";

describe("stripBidiControls", () => {
    it("removes marks, embeddings, overrides and isolates", () => {
        expect(stripBidiControls("From: \u200FBob\u202E - \u2066Invoice\u2069 \u202Atxt.exe\u202C")).toBe(
            "From: Bob - Invoice txt.exe",
        );
    });

    it("keeps right-to-left letters and joiners", () => {
        expect(stripBidiControls("From: דן - שלום עולם")).toBe("From: דן - שלום עולם");
        expect(stripBidiControls("From: علي - مرحبا")).toBe("From: علي - مرحبا");
        expect(stripBidiControls("\u0915\u094D\u200D\u0937 \u0645\u200C\u0627")).toBe(
            "\u0915\u094D\u200D\u0937 \u0645\u200C\u0627",
        );
    });
});
