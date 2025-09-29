import { CryptoProxy, type MaybeArray, type PrivateKeyReference, type PublicKeyReference } from '@proton/crypto';
import { arrayToHexString } from '@proton/crypto/lib/utils';

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
    passphrase: string
) => {
    const forwardingMaterial = await generateForwardingMaterial(
        passphrase,
        forwarderPrivateKey,
        userIDsForForwardeeKey
    );

    const proxyInstances = forwardingMaterial.proxyInstances.map(mapProxyInstance);

    return {
        forwardeeKey: forwardingMaterial.forwardeeKey,
        proxyInstances,
    };
};
