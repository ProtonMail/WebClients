import type { MaybeArray, PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { arrayToHexString } from '@proton/crypto/lib/utils';
import { updateForwarding } from '@proton/shared/lib/api/forwardings';
import { getAndVerifyApiKeys } from '@proton/shared/lib/api/helpers/getAndVerifyApiKeys';
import { createAddressKeyRouteV2 } from '@proton/shared/lib/api/keys';
import { canonicalizeEmailByGuess } from '@proton/shared/lib/helpers/email';
import { toMap } from '@proton/shared/lib/helpers/object';
import type {
    ActiveKey,
    Address,
    Api,
    ApiKeysConfig,
    DecryptedKey,
    IncomingAddressForwarding,
    KeyTransparencyCommit,
    KeyTransparencyVerify,
    OutgoingAddressForwarding,
    VerifyOutboundPublicKeys,
} from '@proton/shared/lib/interfaces';
import { ForwardingType } from '@proton/shared/lib/interfaces';
import {
    decryptMemberToken,
    getAddressKeyToken,
    getDefaultKeyFlags,
    getEmailFromKey,
    getSignedKeyListWithDeferredPublish,
    splitKeys,
} from '@proton/shared/lib/keys';
import { getActiveKeyObject, getActiveKeys, getNormalizedActiveKeys } from '@proton/shared/lib/keys/getActiveKeys';
import { fromSieveTree, toSieveTree } from '@proton/sieve';
import type { SIEVE_VERSION, SieveBranch } from '@proton/sieve/src/interface';
import generateUID from '@proton/utils/generateUID';

import { COMPARATORS, OPERATORS, TYPES } from '../filters/constants';
import type { Condition, FilterCondition, FilterOperator } from '../filters/interfaces';
import { FilterStatement } from '../filters/interfaces';

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

interface ForwardingAddressKeyParameters {
    api: Api;
    privateKey: PrivateKeyReference;
    address: Address;
    activeKeys: ActiveKey[];
    privateKeyArmored: string;
    signature: string;
    encryptedToken: string;
    addressForwardingID: string;
    keyTransparencyVerify: KeyTransparencyVerify;
}

export const generateForwardingAddressKey = async ({
    api,
    privateKey,
    address,
    activeKeys,
    privateKeyArmored,
    signature,
    encryptedToken,
    addressForwardingID,
    keyTransparencyVerify,
}: ForwardingAddressKeyParameters) => {
    const newActiveKey = await getActiveKeyObject(privateKey, {
        ID: 'tmp',
        primary: 0,
        flags: getDefaultKeyFlags(address),
    });
    const updatedActiveKeys = getNormalizedActiveKeys(address, [newActiveKey]);
    const [SignedKeyList, onSKLPublishSuccess] = await getSignedKeyListWithDeferredPublish(
        activeKeys,
        address,
        keyTransparencyVerify
    );
    const { Key } = await api(
        createAddressKeyRouteV2({
            AddressID: address.ID,
            Primary: newActiveKey.primary,
            PrivateKey: privateKeyArmored,
            SignedKeyList,
            Signature: signature,
            Token: encryptedToken,
            AddressForwardingID: addressForwardingID,
        })
    );
    await onSKLPublishSuccess();
    newActiveKey.ID = Key.ID;

    return [newActiveKey, updatedActiveKeys] as const;
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
    forwarderKeyFingerprint: Uint8Array;
    forwardeeKeyFingerprint: Uint8Array;
    proxyParameter: Uint8Array;
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
    addressKeys: DecryptedKey[];
    userKeys: DecryptedKey[];
    forward: IncomingAddressForwarding;
    keyTransparencyVerify: KeyTransparencyVerify;
    keyTransparencyCommit: KeyTransparencyCommit;
    verifyOutboundPublicKeys: VerifyOutboundPublicKeys;
}

export const acceptIncomingForwarding = async ({
    api,
    address,
    addressKeys: forwardeeAddressKeys,
    userKeys,
    forward,
    keyTransparencyVerify,
    keyTransparencyCommit,
    verifyOutboundPublicKeys,
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
        verifyOutboundPublicKeys,
        internalKeysOnly: true,
    });

    const publicKeys = await Promise.all(
        forwarderAddressKeys.map(({ armoredKey }) => CryptoProxy.importPublicKey({ armoredKey }))
    );

    let activeKeys = await getActiveKeys(address, address.SignedKeyList, address.Keys, forwardeeAddressKeys);

    for (const forwardingKey of forward.ForwardingKeys || []) {
        const decryptedToken = await decryptMemberToken(
            forwardingKey.ActivationToken,
            splitAddressKeys.privateKeys,
            publicKeys
        );
        let privateKey = await CryptoProxy.importPrivateKey({
            armoredKey: forwardingKey.PrivateKey,
            passphrase: decryptedToken,
        });
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
            privateKey,
        });
        await keyTransparencyCommit(userKeys);
        activeKeys = updatedActiveKeys;
    }
};

interface EnableForwardingParameters {
    api: Api;
    forward: OutgoingAddressForwarding;
    forwarderAddressKeys: DecryptedKey[];
    forwardeePublicKeys: ApiKeysConfig;
}

export const enableForwarding = async ({
    api,
    forward,
    forwarderAddressKeys,
    forwardeePublicKeys,
}: EnableForwardingParameters) => {
    const email = forward.ForwardeeEmail;
    const splitForwarderAddressKeys = splitKeys(forwarderAddressKeys);
    const [forwarderKey] = splitForwarderAddressKeys.privateKeys;
    const [forwardeePublicKeyArmored] = forwardeePublicKeys.publicKeys || [];
    const forwardeePublicKey = await CryptoProxy.importPublicKey({ armoredKey: forwardeePublicKeyArmored.armoredKey });
    const { activationToken, forwardeeKey, proxyInstances } = await getInternalParametersPrivate(
        forwarderKey,
        [{ email, name: email }],
        forwardeePublicKey
    );
    await api(
        updateForwarding({
            ID: forward.ID,
            ForwardeePrivateKey: forwardeeKey,
            ActivationToken: activationToken,
            ProxyInstances: proxyInstances,
        })
    );
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

export const isLastOutgoingNonE2EEForwarding = (
    forward: OutgoingAddressForwarding,
    forwarding: OutgoingAddressForwarding[]
): boolean => {
    if (forward.Type !== ForwardingType.ExternalUnencrypted) {
        return false;
    }
    const last = forwarding.filter(
        (f) => f.Type === ForwardingType.ExternalUnencrypted && f.ForwarderAddressID === forward.ForwarderAddressID
    );
    return last.length <= 1;
};
