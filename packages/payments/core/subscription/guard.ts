export interface GuardError {
    // TODO: make required when the API will serve the new contract
    Code?: number;
    Message: string;
}

// TODO: remove when the API will serve the new contract
/** Raw guard fields as they appear on `subscription/check` and subscription-creation responses. */
export interface GuardFields {
    GuardResult?: GuardError | string | (GuardError | string)[] | null;
    GuardResultCode?: number;
}

type NormalizedGuardResponse<T> = T & { GuardResult: GuardError[] };

const toGuardError = (item: GuardError | string | null | undefined, fallbackCode?: number): GuardError[] => {
    if (item === null || item === undefined) {
        return [];
    }
    const entry = typeof item === 'string' ? { Message: item } : item;
    const Message = typeof entry.Message === 'string' ? entry.Message.trim() : '';
    const Code = entry.Code ?? fallbackCode;
    return [Code === undefined ? { Message } : { Code, Message }];
};

const toGuardErrors = (GuardResult: GuardFields['GuardResult'], GuardResultCode: number | undefined): GuardError[] => {
    const items = Array.isArray(GuardResult) ? GuardResult : [GuardResult];
    const fallbackCode = Array.isArray(GuardResult) ? undefined : GuardResultCode;
    return items.flatMap((item) => toGuardError(item, fallbackCode));
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

/** Guard error codes returned by the backend on `subscription/check`, used for telemetry. The backend `Message` is already translated and shown as is. */
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
