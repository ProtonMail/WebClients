import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { queryCheckUsernameAvailability } from '@proton/shared/lib/api/user';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import type { ClaimedAddressID } from '@proton/shared/lib/authentication/interface';
import { ADDRESS_STATUS } from '@proton/shared/lib/constants';
import type { Address, Api, User } from '@proton/shared/lib/interfaces';
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
 * otherwise it needs a new address before it can be signed in to.
 */
export type ClaimedAddressSetup =
    { type: 'migrated'; address: string } | { type: 'create'; generation: ClaimedAddressGeneration };

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

    const domains = await api<{ Domains: string[] }>(queryAvailableDomains()).then(({ Domains }) => Domains);
    // The claimed address's local part, offered on a Proton domain when it's free
    const claimableAddress = await getClaimableAddress({ user, api, email: claimedEmail, domains }).catch(noop);
    return {
        type: 'create',
        generation: { availableDomains: domains, claimableAddress: claimableAddress || undefined },
    };
};

/**
 * Creates the new address and its keys, then signs in. An account with keys protects the new address key with the
 * unlocked key password; one without keys gets them now, protected by the login password.
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
        await api(queryCheckUsernameAvailability(`${username}@${domain}`, true));
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
