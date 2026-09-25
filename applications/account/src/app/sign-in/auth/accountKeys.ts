import { serverTime, wasServerTimeEverUpdated } from '@protontech/crypto';

import { getAllAddresses } from '@proton/shared/lib/api/addresses';
import { queryAvailableDomains } from '@proton/shared/lib/api/domains';
import { SecondPasswordError } from '@proton/shared/lib/authentication/error';
import { getUser } from '@proton/shared/lib/authentication/getUser';
import { handleUnlockKey } from '@proton/shared/lib/authentication/unlockKey';
import { wait } from '@proton/shared/lib/helpers/promise';
import { captureMessage, getSentryError } from '@proton/shared/lib/helpers/sentry';
import type { Address, KeySalt as tsKeySalt, User as tsUser } from '@proton/shared/lib/interfaces';
import { migrateUser } from '@proton/shared/lib/keys';
import { handleSetupAddressKeys } from '@proton/shared/lib/keys/setupAddressKeys';
import { getHasV2KeysToUpgrade, upgradeV2KeysHelper } from '@proton/shared/lib/keys/upgradeKeysV2';

import type { AuthSession } from '../../content/authSession';
import { finalizeSignIn } from './finalizeSignIn';
import type { LoginFlowContext } from './loginFlowContext';

/**
 * Upgrades legacy keys and migrates the account if needed, then creates the session.
 * Upgrade and migration failures are reported but don't block the sign-in.
 */
const upgradeKeysAndFinalize = async (
    context: LoginFlowContext,
    {
        user: maybeUser,
        addresses: maybeAddresses,
        loginPassword,
        clearKeyPassword,
        keyPassword: unlockedKeyPassword,
        isOnePasswordMode,
    }: {
        user: tsUser;
        addresses: Address[] | undefined;
        loginPassword: string;
        clearKeyPassword: string;
        keyPassword: string;
        isOnePasswordMode?: boolean;
    }
): Promise<AuthSession> => {
    const { api, preAuthKTVerifier, keyMigrationKTVerifier } = context;
    const { preAuthKTVerify } = preAuthKTVerifier;
    let keyPassword = unlockedKeyPassword;
    let user = maybeUser;
    let addresses = maybeAddresses ?? (await getAllAddresses(api));

    if (getHasV2KeysToUpgrade(user, addresses)) {
        const newKeyPassword = await upgradeV2KeysHelper({
            user,
            addresses,
            loginPassword,
            keyPassword,
            clearKeyPassword,
            isOnePasswordMode,
            api,
            preAuthKTVerify,
            keyMigrationKTVerifier,
        }).catch((e) => {
            const error = getSentryError(e);
            if (error) {
                captureMessage('Key upgrade error', { extra: { error } });
            }
            return undefined;
        });
        if (newKeyPassword !== undefined) {
            [user, addresses] = await Promise.all([getUser(api), getAllAddresses(api)]);
            keyPassword = newKeyPassword;
        }
    }

    const hasDoneMigration = await migrateUser({
        api,
        keyPassword,
        user,
        addresses,
        preAuthKTVerify,
        keyMigrationKTVerifier,
    }).catch((e) => {
        const error = getSentryError(e);
        if (error) {
            captureMessage('Key migration error', {
                extra: { error, serverTime: serverTime(), isServerTime: wasServerTimeEverUpdated() },
            });
        }
        return false;
    });

    return finalizeSignIn(context, {
        // A migration changes the keys, so the session is created from freshly fetched data
        user: hasDoneMigration ? undefined : user,
        addresses: hasDoneMigration ? undefined : addresses,
        loginPassword,
        keyPassword,
        clearKeyPassword,
    });
};

/**
 * Decrypts the primary private key with the password, then signs in.
 * A wrong password throws a `PasswordError`, so the caller can let the user retry.
 */
export const unlockAccountKeys = async (
    context: LoginFlowContext,
    {
        user,
        salts,
        addresses,
        loginPassword,
        clearKeyPassword,
        isOnePasswordMode,
    }: {
        user: tsUser;
        salts: tsKeySalt[];
        addresses: Address[] | undefined;
        loginPassword: string;
        clearKeyPassword: string;
        isOnePasswordMode: boolean;
    }
): Promise<AuthSession> => {
    await wait(500);

    const unlockResult = await handleUnlockKey(user, salts, clearKeyPassword).catch(() => undefined);
    if (!unlockResult) {
        throw new SecondPasswordError();
    }

    return upgradeKeysAndFinalize(context, {
        user,
        addresses,
        loginPassword,
        clearKeyPassword,
        keyPassword: unlockResult.keyPassword,
        isOnePasswordMode,
    });
};

/** Creates the address keys of an account that has none, protected by `newPassword`, then signs in. */
export const setupAccountKeys = async (
    context: LoginFlowContext,
    { addresses: maybeAddresses, newPassword }: { addresses: Address[] | undefined; newPassword: string }
): Promise<AuthSession> => {
    const { api, username, preAuthKTVerifier, productParam } = context;

    const [domains, addresses] = await Promise.all([
        api<{ Domains: string[] }>(queryAvailableDomains('signup')).then(({ Domains }) => Domains),
        maybeAddresses ?? getAllAddresses(api),
    ]);

    const keyPassword = await handleSetupAddressKeys({
        api,
        username,
        password: newPassword,
        addresses,
        domains,
        preAuthKTVerify: preAuthKTVerifier.preAuthKTVerify,
        productParam,
    });

    // The keys just changed, so the session is created from freshly fetched data
    return finalizeSignIn(context, {
        user: undefined,
        addresses: undefined,
        loginPassword: newPassword,
        keyPassword,
        clearKeyPassword: newPassword,
    });
};
