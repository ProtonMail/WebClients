import type { MaybeArray, PrivateKeyReference, PrivateKeyReferenceV4, PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { arrayToHexString } from '@proton/crypto/lib/utils';
import { getAndVerifyApiKeys } from '@proton/shared/lib/api/helpers/getAndVerifyApiKeys';
import { canonicalizeEmailByGuess } from '@proton/shared/lib/helpers/email';
import { toMap } from '@proton/shared/lib/helpers/object';
import type {
    Address,
    Api,
    DecryptedAddressKey,
    DecryptedKey,
    IncomingAddressForwarding,
    KTUserContext,
    KeyTransparencyCommit,
    KeyTransparencyVerify,
    OutgoingAddressForwarding,
    UserModel,
} from '@proton/shared/lib/interfaces';
import { ForwardingType } from '@proton/shared/lib/interfaces';
import { decryptMemberToken, getAddressKeyToken, getEmailFromKey, splitKeys } from '@proton/shared/lib/keys';
import { getActiveAddressKeys } from '@proton/shared/lib/keys/getActiveKeys';
import { fromSieveTree, toSieveTree } from '@proton/sieve';
import type { SIEVE_VERSION, SieveBranch } from '@proton/sieve/src/interface';
import generateUID from '@proton/utils/generateUID';

import { COMPARATORS, OPERATORS, TYPES } from '../filters/constants';
import type { Condition, FilterCondition, FilterOperator } from '../filters/interfaces';
import { FilterStatement } from '../filters/interfaces';
import { generateForwardingAddressKey } from './keyHelpers';

const toSieveOperator = (statement: FilterStatement): FilterOperator => {
    const operatorsMap = toMap(OPERATORS, 'value');
    return operatorsMap[statement];
};

const toSieveConditions = (conditions: Condition[]): FilterCondition[] => {
    const comparatorsMap = toMap(COMPARATORS, 'value');
    const typesMap = toMap(TYPES, 'value');

    return conditions.map((cond) => ({
        Comparator: comparatorsMap[cond.comparator],
        Type: typesMap[cond.type],
        Values: cond.values || [],
    }));
};

export const getSieveTree = ({
    conditions,
    statement,
    version = 2,
    email,
}: {
    conditions: Condition[];
    statement: FilterStatement;
    version?: SIEVE_VERSION;
    email: string;
}): SieveBranch[] | null => {
    if (conditions.length === 0) {
        return null;
    }
    return toSieveTree(
        {
            Operator: toSieveOperator(statement),
            Conditions: toSieveConditions(conditions),
            Actions: {
                FileInto: [],
                Vacation: '',
                Mark: { Read: false, Starred: false },
                Redirects: [{ Address: email, Copy: true }],
            },
        },
        version
    );
};

export const getSieveParameters = (tree: SieveBranch[]): { conditions: Condition[]; statement: FilterStatement } => {
    const simple = fromSieveTree(tree);
    if (!simple) {
        return {
            conditions: [],
            statement: FilterStatement.ALL,
        };
    }
    return {
        conditions:
            simple.Conditions.map((cond) => ({
                type: cond.Type.value,
                comparator: cond.Comparator.value,
                values: cond.Values || [],
                isOpen: true,
                defaultValue: cond.Values[0] || '',
                id: generateUID('condition'),
            })) || [],
        statement: simple.Operator?.value || FilterStatement.ALL,
    };
};

interface UserID {
    name?: string;
    email?: string;
}

const generateRandomHexPassphrase = () => {
    const randomBytes = crypto.getRandomValues(new Uint8Array(32));
    return arrayToHexString(randomBytes);
};

const generateForwardingMaterial = async (
    passphrase: string,
    forwarderPrivateKey: PrivateKeyReference,
    userIDsForForwardeeKey: MaybeArray<UserID>
) => {
    const forwardingMaterial = await CryptoProxy.generateE2EEForwardingMaterial({
        passphrase,
        forwarderKey: forwarderPrivateKey,
        userIDsForForwardeeKey,
    });
    return forwardingMaterial;
};

const encryptAndSignPassphrase = async (
    passphrase: string,
    forwarderPrivateKey: PrivateKeyReference,
    forwardeePublicKey: PublicKeyReference
) => {
    const activationToken = await CryptoProxy.encryptMessage({
        textData: passphrase,
        signingKeys: [forwarderPrivateKey],
        encryptionKeys: [forwardeePublicKey],
    });
    return activationToken.message;
};

interface ProxyInstance {
    keyVersion: number;
    forwarderKeyFingerprint: Uint8Array<ArrayBuffer>;
    forwardeeKeyFingerprint: Uint8Array<ArrayBuffer>;
    proxyParameter: Uint8Array<ArrayBuffer>;
}

const mapProxyInstance = (proxyInstance: ProxyInstance) => ({
    PgpVersion: proxyInstance.keyVersion,
    ForwarderKeyFingerprint: arrayToHexString(proxyInstance.forwarderKeyFingerprint),
    ForwardeeKeyFingerprint: arrayToHexString(proxyInstance.forwardeeKeyFingerprint),
    ProxyParam: arrayToHexString(proxyInstance.proxyParameter),
});

export const getInternalParametersPrivate = async (
    forwarderPrivateKey: PrivateKeyReference,
    userIDsForForwardeeKey: MaybeArray<UserID>,
    forwardeePublicKey: PublicKeyReference
) => {
    const passphrase = generateRandomHexPassphrase();
    const [forwardingMaterial, activationToken] = await Promise.all([
        generateForwardingMaterial(passphrase, forwarderPrivateKey, userIDsForForwardeeKey),
        encryptAndSignPassphrase(passphrase, forwarderPrivateKey, forwardeePublicKey),
    ]);

    const proxyInstances = forwardingMaterial.proxyInstances.map(mapProxyInstance);

    return {
        activationToken,
        forwardeeKey: forwardingMaterial.forwardeeKey,
        proxyInstances,
    };
};

export const getInternalParameters = async (
    forwarderPrivateKey: PrivateKeyReference,
    userIDsForForwardeeKey: MaybeArray<UserID>,
    forwardeePublicKey: PublicKeyReference,
    Token: string | undefined,
    Signature: string | undefined,
    privateKeys: PrivateKeyReference[],
    publicKeys: PublicKeyReference[]
) => {
    let decryptedToken: string;
    try {
        decryptedToken = await getAddressKeyToken({
            Token: Token ?? '', // Aron: please check
            Signature: Signature ?? '',
            privateKeys: privateKeys,
            publicKeys: publicKeys,
        });
    } catch (err) {
        const name = (err as { name?: string })?.name;
        const message = (err as { message?: string })?.message;

        const treatAsPrivate = name === 'SignatureError' || message === 'Missing organization key';

        if (treatAsPrivate) {
            // we can't decrypt the token with the provided information,
            // treat as if private member
            return getInternalParametersPrivate(forwarderPrivateKey, userIDsForForwardeeKey, forwardeePublicKey);
        }

        throw err; // throw error again if unfixable
    }

    const forwardingMaterial = await generateForwardingMaterial(
        decryptedToken,
        forwarderPrivateKey,
        userIDsForForwardeeKey
    );

    const proxyInstances = forwardingMaterial.proxyInstances.map(mapProxyInstance);

    return {
        activationToken: undefined,
        forwardeeKey: forwardingMaterial.forwardeeKey,
        proxyInstances,
    };
};

interface AcceptIncomingForwardingParameters {
    api: Api;
    address: Address;
    addressKeys: DecryptedAddressKey[];
    user: UserModel;
    userKeys: DecryptedKey[];
    forward: IncomingAddressForwarding;
    keyTransparencyVerify: KeyTransparencyVerify;
    keyTransparencyCommit: KeyTransparencyCommit;
    ktUserContext: KTUserContext;
}

export const acceptIncomingForwarding = async ({
    api,
    address,
    addressKeys: forwardeeAddressKeys,
    user,
    userKeys,
    forward,
    keyTransparencyVerify,
    keyTransparencyCommit,
    ktUserContext,
}: AcceptIncomingForwardingParameters) => {
    if (!address) {
        throw new Error('No address');
    }

    const forwardeeEmail = address.Email;
    const splitUserKeys = splitKeys(userKeys);
    const splitAddressKeys = splitKeys(forwardeeAddressKeys);
    const [primaryAddressKey] = address.Keys;

    if (!primaryAddressKey || !primaryAddressKey.Token) {
        throw new Error('No primary address key');
    }

    const decryptedPrimaryAddressKeyToken = await getAddressKeyToken({
        Token: primaryAddressKey.Token,
        Signature: primaryAddressKey.Signature,
        privateKeys: splitUserKeys.privateKeys,
        publicKeys: splitUserKeys.publicKeys,
    });

    const { addressKeys: forwarderAddressKeys } = await getAndVerifyApiKeys({
        api,
        email: forward.ForwarderEmail,
        ktUserContext,
        internalKeysOnly: true,
    });

    const forwarderPublicKeys = forwarderAddressKeys.map(({ publicKey }) => publicKey);

    let activeKeys = await getActiveAddressKeys(address.SignedKeyList, forwardeeAddressKeys);

    // Multiple ForwardingKeys objects are present if e.g. the forwarder changed their primary key and updated/re-enabled
    // the forwarding request while it was still pending (yet to be accepted by the forwardee).
    for (const forwardingKey of forward.ForwardingKeys || []) {
        const decryptedToken = await decryptMemberToken(
            forwardingKey.ActivationToken,
            splitAddressKeys.privateKeys,
            forwarderPublicKeys
        );
        let privateKey = await CryptoProxy.importPrivateKey({
            armoredKey: forwardingKey.PrivateKey,
            passphrase: decryptedToken,
        });
        if (!privateKey.isPrivateKeyV4()) {
            // this should be unreachable since v6 keys do not support forwarding atm
            throw new Error('Unexpected v6 key');
        }
        const extractedEmail = getEmailFromKey(privateKey);

        // The forwardee email address can change before the user has accepted the forwarding
        // So we need to update the private key with the email address returned by the API
        // Use strict comparison because capitalization matters
        if (extractedEmail !== forwardeeEmail) {
            const updatedPrivateKey = await CryptoProxy.cloneKeyAndChangeUserIDs({
                userIDs: [{ name: forwardeeEmail, email: forwardeeEmail }],
                privateKey,
            });
            await CryptoProxy.clearKey({ key: privateKey });
            privateKey = updatedPrivateKey;
        }

        const armoredPrivateKey = await CryptoProxy.exportPrivateKey({
            privateKey,
            passphrase: decryptedPrimaryAddressKeyToken,
        });
        const [, updatedActiveKeys] = await generateForwardingAddressKey({
            api,
            address,
            keyTransparencyVerify,
            addressForwardingID: forward.ID,
            encryptedToken: primaryAddressKey.Token,
            signature: primaryAddressKey.Signature,
            privateKeyArmored: armoredPrivateKey,
            activeKeys,
            privateKey: privateKey as PrivateKeyReferenceV4,
        });
        await keyTransparencyCommit(user, userKeys);
        activeKeys = updatedActiveKeys;
    }
};

export const getChainedForwardingEmails = (
    incoming: IncomingAddressForwarding[],
    outgoing: OutgoingAddressForwarding[],
    addresses: Address[]
) => {
    const addressesMap = toMap(addresses);
    const forwardeeEmails = incoming.map(({ ForwardeeAddressID }) =>
        canonicalizeEmailByGuess(addressesMap[ForwardeeAddressID]?.Email || '')
    );
    const forwarderEmails = outgoing.map(({ ForwarderAddressID }) =>
        canonicalizeEmailByGuess(addressesMap[ForwarderAddressID]?.Email || '')
    );
    return forwarderEmails.filter((email) => forwardeeEmails.includes(email));
};

export const isChainedForwarding = (chainedEmails: string[], email: string) => {
    // chainedEmails is already canonicalized by getChainedForwardingEmails
    return chainedEmails.includes(canonicalizeEmailByGuess(email));
};

export const getIsLastOutgoingNonE2EEForwarding = (
    outgoingForwardingConfig: OutgoingAddressForwarding,
    allOutgoingForwardingConfigs: OutgoingAddressForwarding[]
): boolean => {
    if (outgoingForwardingConfig.Type !== ForwardingType.ExternalUnencrypted) {
        return false;
    }
    const nonE2EEForwardings = allOutgoingForwardingConfigs.filter(
        (f) =>
            f.Type === ForwardingType.ExternalUnencrypted &&
            f.ForwarderAddressID === outgoingForwardingConfig.ForwarderAddressID
    );
    return nonE2EEForwardings.length <= 1;
};
