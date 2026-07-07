import type { SerializedUrlRule } from "@proton/shared/lib/desktop/urls/builder";

import { urlRedirectManager } from "./manager";

const rule = (id: string, pattern: string): SerializedUrlRule => ({
    id,
    pattern,
    regex: RegExp(pattern),
    flags: "i",
});

describe("UrlRedirectManager", () => {
    beforeEach(() => {
        urlRedirectManager.addRules([]);
    });

    it("matches a registered rule for a source", () => {
        urlRedirectManager.addRules([rule("mail-view", "^https://mail\\.proton\\.me(?:/.*)?$")]);

        expect(urlRedirectManager.match("https://mail.proton.me/u/0/inbox")).toBeTruthy();
        expect(urlRedirectManager.match("https://example.com")).toBeFalsy();
    });

    it("extends the rule-set", () => {
        urlRedirectManager.addRules([rule("account-old", "^https://account\\.proton\\.me/old$")]);
        urlRedirectManager.addRules([rule("account-new", "^https://account\\.proton\\.me/new$")]);

        expect(urlRedirectManager.match("https://account.proton.me/old")).toBeTruthy();
        expect(urlRedirectManager.match("https://account.proton.me/new")).toBeTruthy();
    });
});
