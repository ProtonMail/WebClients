import { CryptoProxy, type MaybeArray, type PrivateKeyReference, type PublicKeyReference } from '@proton/crypto';
import { arrayToHexString } from '@proton/crypto/lib/utils';
import { getAddressKeyToken } from '@proton/shared/lib/keys/addressKeys';

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
