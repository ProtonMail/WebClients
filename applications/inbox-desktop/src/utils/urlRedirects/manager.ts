import type { SerializedUrlRule } from "@proton/shared/lib/desktop/urls/builder";
import { matchUrlRules } from "@proton/shared/lib/desktop/urls/matcher";
import { URL_RULES } from "@proton/shared/lib/desktop/urls/rules";

class UrlRedirectManager {
    private ruleIds: Set<string> = new Set();
    private rules: SerializedUrlRule[] = [];

    private static instance: UrlRedirectManager;

    private constructor() {
        this.addRules(URL_RULES);
    }

    // addRules extends the rule-set only if they are not already present.
    public addRules(rules: SerializedUrlRule[]): void {
        for (const rule of rules) {
            if (this.ruleIds.has(rule.id)) {
                continue;
            }
            this.ruleIds.add(rule.id);
            this.rules.push(rule);
        }
    }

    public match(url: string): boolean {
        return matchUrlRules(url, this.rules);
    }

    public static getInstance(): UrlRedirectManager {
        if (!UrlRedirectManager.instance) {
            UrlRedirectManager.instance = new UrlRedirectManager();
        }
        return UrlRedirectManager.instance;
    }
}

export const urlRedirectManager = UrlRedirectManager.getInstance();
