import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import type { EntitlementChecks } from '@proton/payments/core/entitlements/resolver';
import { getLanguageCode } from '@proton/shared/lib/i18n/helper';

// The survey is only for orgs with more than this many users.
export const ADMIN_CONSOLE_SURVEY_MIN_USERS = 10;

// Hardcoded on purpose. This is a short-lived research study and the feature flag is switched off once enough
// participants have signed up, so the list is not expected to change. It reflects the languages the study can be
// run in. If the list ever needs to change while the study is live, move it to a payload on the feature flag
// (see resolveMaxContactsImportConfig for the pattern) rather than redeploying.
const ADMIN_CONSOLE_SURVEY_LANGUAGES = ['en', 'de'];

interface Params {
    entitlements: EntitlementChecks;
    /** Number of users actually in the organization, not the seats purchased. */
    usedMembers: number;
    /** The language the UI is currently displayed in, e.g. `en_US` or `de_DE`. */
    localeCode: string;
}

/**
 * Whether the admin console survey card can be shown. Intentionally has no admin check: the Users and addresses
 * page is only reachable with the `account.user.read` permission, so everyone who sees it is already an admin.
 */
export const getIsAdminConsoleSurveyEligible = ({ entitlements, usedMembers, localeCode }: Params) => {
    // The spec targets the B2B Pass, VPN and Workspace plans. `orgIsBusiness` alone would also match business plans
    // that are not in the study (Mail, Drive, Meet, Lumo), so we additionally require a VPN or Pass entitlement.
    const isEligiblePlan =
        entitlements.orgIsBusiness && (entitlements.orgHasVpn || !!entitlements.quantityOrg(EntitlementName.FlagsPass));

    return (
        isEligiblePlan &&
        usedMembers > ADMIN_CONSOLE_SURVEY_MIN_USERS &&
        ADMIN_CONSOLE_SURVEY_LANGUAGES.includes(getLanguageCode(localeCode))
    );
};
