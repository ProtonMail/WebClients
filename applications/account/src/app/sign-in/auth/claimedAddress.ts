import { c } from 'ttag';

import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { getApiError, getApiErrorMessage } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { queryCheckUsernameAvailability } from '@proton/shared/lib/api/user';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import type { ClaimedAddressID } from '@proton/shared/lib/authentication/interface';
import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import { type User, UserType } from '@proton/shared/lib/interfaces/User';
import {
    type ClaimableAddress,
    getClaimableAddress,
    handleCreateAddressAndKey,
    handleSetupAddressAndKey,
} from '@proton/shared/lib/keys/setupAddress';
import noop from '@proton/utils/noop';

import type { AuthSession } from '../../content/authSession';
import { upgradeKeysAndFinalize } from './accountKeys';
import { finalizeSignIn } from './finalizeSignIn';
import type { LoginFlowContext } from './loginFlowContext';

/**
 * Set while recovering an account whose address was claimed by an organization. The sign-in's username stays the
 * claimed address the user typed; this is the ID the API resolved it to the account with.
 */
export interface ClaimedAddressRecovery {
    id: ClaimedAddressID;
}

/** The account's keys, unlocked for the new address's key. */
export interface UnlockedKeys {
    keyPassword: string;
    clearKeyPassword: string;
    /** Unlocked with the login password, rather than a second one: the key upgrade at sign-in depends on it. */
    isOnePasswordMode: boolean;
}

/** Where to create the new address: the domains, and the address offered as-is when there is one. */
interface ClaimedAddressGeneration {
    availableDomains: string[];
    claimableAddress: ClaimableAddress | undefined;
}

/**
 * How the recovery finishes. An account that still has an enabled address only learns where its data now lives;
 * otherwise it needs a new address before it can be signed in to. An organization member (`managed`) can't create one:
 * its organization manages its addresses, so it only learns that, and is signed in without one.
 */
export type ClaimedAddressSetup =
    | { type: 'migrated'; address: string }
    | { type: 'managed' }
    | { type: 'create'; generation: ClaimedAddressGeneration };

/**
 * Decides how the recovery finishes. Any enabled address counts, external ones too, as it does for the API: it keeps
 * the claim (and with it the way back in) until the account has one.
 */
export const loadClaimedAddressSetup = async ({
    api,
    user,
    claimedEmail,
}: {
    api: Api;
    user: User;
    claimedEmail: string;
}): Promise<ClaimedAddressSetup> => {
    const addresses = await getAllAddresses(api);
    const enabledAddress = addresses.find((address) => address.Status === ADDRESS_STATUS.STATUS_ENABLED);
    if (enabledAddress) {
        return { type: 'migrated', address: enabledAddress.Email };
    }

    // The API refuses an organization member's username and address setup: its administrator gives it addresses
    if (user.Type === UserType.MANAGED) {
        return { type: 'managed' };
    }

    const domains = await api<{ Domains: string[] }>(queryAvailableDomains()).then(({ Domains }) => Domains);
    // The claimed address's local part, offered on a Proton domain when it's free
    const claimableAddress = await getClaimableAddress({ user, api, email: claimedEmail, domains }).catch(noop);
    return {
        type: 'create',
        generation: { availableDomains: domains, claimableAddress: claimableAddress || undefined },
    };
};

/**
 * The availability check rejected the username for the new address, as signup reads it: nothing was created yet, so
 * another username can be tried. Shows the API's message, which it keeps as the cause, and says which address it was.
 */
export class UnavailableUsernameError extends Error {
    name = 'UnavailableUsernameError';

    readonly trace = false;

    readonly username: string;

    readonly domain: string;

    constructor(cause: unknown, { username, domain }: { username: string; domain: string }) {
        super(getApiErrorMessage(cause) || c('Error').t`Unknown error`, { cause });
        this.username = username;
        this.domain = domain;
    }
}

const unavailableUsernameCodes: number[] = [
    API_CUSTOM_ERROR_CODES.ALREADY_USED,
    API_CUSTOM_ERROR_CODES.USERNAME_ALREADY_USED,
    API_CUSTOM_ERROR_CODES.NOT_ALLOWED,
];

/**
 * Creates the new address and its keys, then signs in. An account with keys protects the new address key with the
 * unlocked key password; one without keys gets them now, protected by the login password. A username the
 * availability check rejects fails with an `UnavailableUsernameError`; any other failure may come after something was
 * created.
 */
export const createClaimedAddressAndFinalize = async (
    context: LoginFlowContext,
    {
        user,
        loginPassword,
        unlocked,
        username,
        domain,
        checkAvailability,
    }: {
        user: User;
        loginPassword: string;
        /** The unlocked keys, for an account that has keys. */
        unlocked: UnlockedKeys | undefined;
        username: string;
        domain: string;
        /** A fixed username (the account already has one) was checked when it was offered. */
        checkAvailability: boolean;
    }
): Promise<AuthSession> => {
    const { api, preAuthKTVerifier, productParam } = context;

    if (checkAvailability) {
        try {
            await api(queryCheckUsernameAvailability(`${username}@${domain}`, true));
        } catch (error) {
            if (unavailableUsernameCodes.includes(getApiError(error).code)) {
                throw new UnavailableUsernameError(error, { username, domain });
            }
            throw error;
        }
    }

    const addresses: Address[] = await getAllAddresses(api);

    if (unlocked) {
        await handleCreateAddressAndKey({
            username,
            domain,
            api,
            passphrase: unlocked.keyPassword,
            preAuthKTVerify: preAuthKTVerifier.preAuthKTVerify,
            user,
            addresses,
        });
        // Setting up the address also sets the username, so the session is created from freshly fetched data
        return upgradeKeysAndFinalize(context, {
            user: await getUser(api),
            addresses: undefined,
            loginPassword,
            clearKeyPassword: unlocked.clearKeyPassword,
            keyPassword: unlocked.keyPassword,
            isOnePasswordMode: unlocked.isOnePasswordMode,
        });
    }

    const keyPassword = await handleSetupAddressAndKey({
        username,
        domain,
        api,
        password: loginPassword,
        preAuthKTVerify: preAuthKTVerifier.preAuthKTVerify,
        productParam,
        user,
        addresses,
    });
    // The keys just changed, so the session is created from freshly fetched data
    return finalizeSignIn(context, {
        user: undefined,
        addresses: undefined,
        loginPassword,
        keyPassword,
        clearKeyPassword: loginPassword,
    });
};
