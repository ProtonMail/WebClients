import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { PLANS, PLAN_NAMES } from '../constants';

export interface GuardError {
    // TODO: make required when the API will serve the new contract
    Code?: number;
    Message: string;
}

// TODO: remove when the API will serve the new contract
/** Raw guard fields as they appear on `subscription/check` and subscription-creation responses. */
export interface GuardFields {
    GuardResult?: GuardError | GuardError[] | string | null;
    GuardResultCode?: number;
}

type NormalizedGuardResponse<T> = T & { GuardResult: GuardError[] };

// TODO: remove when the API will serve the new contract
const toGuardErrors = (GuardResult: GuardFields['GuardResult'], GuardResultCode: number | undefined): GuardError[] => {
    if (typeof GuardResult === 'string') {
        return [{ Code: GuardResultCode, Message: GuardResult }];
    }
    if (Array.isArray(GuardResult)) {
        return GuardResult;
    }
    if (GuardResult) {
        return [GuardResult];
    }
    return [];
};

/**
 * Takes a `subscription/check` or subscription-creation response and returns a copy whose
 * `GuardResult` is always a list of {@link GuardError} (empty when the selection passed all
 * guards). Handles the transition shape (`GuardResult` message string + `GuardResultCode`
 * number) and single-object shapes. The input is not modified.
 */
export const normalizeGuardResult = <T extends GuardFields>(response: T): NormalizedGuardResponse<T> => {
    const { GuardResult, GuardResultCode, ...rest } = response ?? {};
    return { ...rest, GuardResult: toGuardErrors(GuardResult, GuardResultCode) } as NormalizedGuardResponse<T>;
};

/**
 * Guard error codes returned by the backend on `subscription/check`, mirroring its
 * `GUARD_*` constants. The backend `Message` is never rendered — copy comes from
 * {@link GUARD_ERROR_MESSAGES} so it is translatable and locale-independent.
 */
export enum GUARD_ERROR_CODES {
    TRIAL_TOO_MANY_LUMO_SEATS = 801001000,
    SCRIBE_SEATS_EXCEED_MEMBERS = 801002000,
    PASS_LIFETIME_INCLUDES_PASS_PLUS = 801003000,
    PASS_LIFETIME_ALREADY_OWNED = 801003001,
    PASS_LIFETIME_EXCEEDS_SINGLE_UNIT = 801003002,
    PASS_LIFETIME_NOT_ON_BUSINESS_PLAN = 801003003,
    CREDITS_REQUIRE_CREDITS_ENDPOINT = 801003004,
    DEDICATED_SERVER_ASSIGNED_TO_GATEWAY = 801004000,
    TRIAL_TOO_MANY_DEDICATED_IPS = 801004001,
    ORGANIZATION_MISSING = 801005000,
    PLAN_REJECTS_EXISTING_MEMBERS = 801005001,
    TOO_FEW_ADDRESSES = 801005002,
    TOO_FEW_MEMBERS = 801005003,
    TOO_FEW_DOMAINS = 801005004,
    TOO_LITTLE_SPACE = 801005005,
    TRIAL_TOO_MANY_MEMBERS = 801005006,
    TRIAL_TOO_MANY_CUSTOM_DOMAINS = 801005007,
    PLAN_REMOVES_MSP_FEATURES = 801005008,
    TRIAL_TOO_MANY_SCRIBE_SEATS = 801006000,
    EXTRA_WALLETS_PRESENT = 801007000,
    EXTRA_WALLET_ACCOUNTS_PRESENT = 801007001,
    BORN_PRIVATE_REQUIRES_DONATION = 801008000,
    BORN_PRIVATE_ALREADY_OWNED = 801008001,
    BORN_PRIVATE_ACCOUNT_TOO_OLD = 801008002,
    BORN_PRIVATE_RUNNING_SUBSCRIPTION = 801008003,
    MEET_SEATS_MUST_MATCH_MEMBERS = 801009000,
}

/**
 * Code → localised copy for each known guard error. Values are thunks so translation happens at
 * render time, not at import. Being a full Record, TypeScript forces an entry here whenever a new
 * code is added to {@link GUARD_ERROR_CODES}.
 */
const GUARD_ERROR_COPY: Record<GUARD_ERROR_CODES, () => string> = {
    [GUARD_ERROR_CODES.TRIAL_TOO_MANY_LUMO_SEATS]: () =>
        c('Payments').t`Trial plans don’t support ${LUMO_SHORT_APP_NAME} seats.`,
    [GUARD_ERROR_CODES.SCRIBE_SEATS_EXCEED_MEMBERS]: () =>
        c('Payments').t`Scribe seats can’t exceed the number of members.`,
    [GUARD_ERROR_CODES.PASS_LIFETIME_INCLUDES_PASS_PLUS]: () =>
        c('Payments').t`${PLAN_NAMES[PLANS.PASS_LIFETIME]} can’t be combined with ${PLAN_NAMES[PLANS.PASS]}.`,
    [GUARD_ERROR_CODES.PASS_LIFETIME_ALREADY_OWNED]: () =>
        c('Payments').t`You already own ${PLAN_NAMES[PLANS.PASS_LIFETIME]}.`,
    [GUARD_ERROR_CODES.PASS_LIFETIME_EXCEEDS_SINGLE_UNIT]: () =>
        c('Payments').t`Only one ${PLAN_NAMES[PLANS.PASS_LIFETIME]} can be purchased.`,
    [GUARD_ERROR_CODES.PASS_LIFETIME_NOT_ON_BUSINESS_PLAN]: () =>
        c('Payments').t`${PLAN_NAMES[PLANS.PASS_LIFETIME]} is only available on business plans.`,
    [GUARD_ERROR_CODES.CREDITS_REQUIRE_CREDITS_ENDPOINT]: () =>
        c('Payments').t`Buying credits requires a separate purchase.`,
    [GUARD_ERROR_CODES.DEDICATED_SERVER_ASSIGNED_TO_GATEWAY]: () =>
        c('Payments').t`This dedicated server is assigned to a gateway and can’t be changed.`,
    [GUARD_ERROR_CODES.TRIAL_TOO_MANY_DEDICATED_IPS]: () => c('Payments').t`Trial plans don’t support dedicated IPs.`,
    [GUARD_ERROR_CODES.ORGANIZATION_MISSING]: () => c('Payments').t`An organization is required for this plan.`,
    [GUARD_ERROR_CODES.PLAN_REJECTS_EXISTING_MEMBERS]: () =>
        c('Payments').t`This plan doesn’t support the members on your account.`,
    [GUARD_ERROR_CODES.TOO_FEW_ADDRESSES]: () =>
        c('Payments').t`The selected plan doesn’t offer enough addresses for your account.`,
    [GUARD_ERROR_CODES.TOO_FEW_MEMBERS]: () =>
        c('Payments').t`The selected plan doesn’t offer enough members for your account.`,
    [GUARD_ERROR_CODES.TOO_FEW_DOMAINS]: () =>
        c('Payments').t`The selected plan doesn’t offer enough domains for your account.`,
    [GUARD_ERROR_CODES.TOO_LITTLE_SPACE]: () =>
        c('Payments').t`The selected plan doesn’t offer enough storage for your account.`,
    [GUARD_ERROR_CODES.TRIAL_TOO_MANY_MEMBERS]: () => c('Payments').t`Trial plans don’t support this many members.`,
    [GUARD_ERROR_CODES.TRIAL_TOO_MANY_CUSTOM_DOMAINS]: () => c('Payments').t`Trial plans don’t support custom domains.`,
    [GUARD_ERROR_CODES.PLAN_REMOVES_MSP_FEATURES]: () =>
        c('Payments').t`This plan doesn’t support the managed features on your account.`,
    [GUARD_ERROR_CODES.TRIAL_TOO_MANY_SCRIBE_SEATS]: () => c('Payments').t`Trial plans don’t support Scribe seats.`,
    [GUARD_ERROR_CODES.EXTRA_WALLETS_PRESENT]: () =>
        c('Payments').t`Please close extra wallets before changing your plan.`,
    [GUARD_ERROR_CODES.EXTRA_WALLET_ACCOUNTS_PRESENT]: () =>
        c('Payments').t`Please close extra wallet accounts before changing your plan.`,
    [GUARD_ERROR_CODES.BORN_PRIVATE_REQUIRES_DONATION]: () => c('Payments').t`Born Private requires a donation.`,
    [GUARD_ERROR_CODES.BORN_PRIVATE_ALREADY_OWNED]: () => c('Payments').t`You already own Born Private.`,
    [GUARD_ERROR_CODES.BORN_PRIVATE_ACCOUNT_TOO_OLD]: () => c('Payments').t`Your account is too old for Born Private.`,
    [GUARD_ERROR_CODES.BORN_PRIVATE_RUNNING_SUBSCRIPTION]: () =>
        c('Payments').t`Born Private can’t be purchased with an active subscription.`,
    [GUARD_ERROR_CODES.MEET_SEATS_MUST_MATCH_MEMBERS]: () =>
        c('Payments').t`Proton Meet seats must match the number of members.`,
};

/**
 * Code → localised copy, built from {@link GUARD_ERROR_COPY}. Unmapped codes coming from the
 * backend are handled by the caller (see GuardBanner).
 */
export const GUARD_ERROR_MESSAGES = new Map<number, () => string>(
    Object.entries(GUARD_ERROR_COPY).map(([code, message]) => [Number(code), message])
);
