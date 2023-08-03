import { BigNumber, Modulus } from 'asmcrypto.js/dist_es8/bignum/bignum';

import { arrayToBinaryString, binaryStringToArray, decodeBase64, encodeBase64 } from '@proton/crypto/lib/utils';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import { AUTH_VERSION, MAX_VALUE_ITERATIONS, SRP_LEN } from './constants';
import { AuthCredentials, AuthInfo } from './interface';
import { expandHash, hashPassword } from './passwords';
import { fromBN, toBN } from './utils/bigNumber';
import { verifyAndGetModulus } from './utils/modulus';
import { checkUsername } from './utils/username';

const ZERO_BN = BigNumber.fromNumber(0);
const ONE_BN = BigNumber.fromNumber(1);
const TWO_BN = BigNumber.fromNumber(2);

export const srpHasher = (arr: Uint8Array) => expandHash(arr);

/**
 * Generate a random client secret.
 */
const generateClientSecret = (len: number) => toBN(crypto.getRandomValues(new Uint8Array(len / 8)));

/**
 * Get the client secret. Loops until it finds a safe value.
 */
const getClientSecret = (len: number) => {
    const comparator = BigNumber.fromNumber(len * 2);

    for (let i = 0; i < MAX_VALUE_ITERATIONS; ++i) {
        const clientSecret = generateClientSecret(len);

        if (clientSecret.compare(comparator) <= 0) {
            continue;
        }

        return clientSecret;
    }

    throw new Error('Could not find safe client value');
};

interface GenerateParametersArgs {
    len: number;
    generator: BigNumber;
    modulus: Modulus;
    serverEphemeralArray: Uint8Array;
}

const generateParameters = async ({ len, generator, modulus, serverEphemeralArray }: GenerateParametersArgs) => {
    const clientSecret = getClientSecret(len);
    const clientEphemeral = modulus.power(generator, clientSecret);
    const clientEphemeralArray = fromBN(len, clientEphemeral);

    const clientServerHash = await srpHasher(mergeUint8Arrays([clientEphemeralArray, serverEphemeralArray]));
    const scramblingParam = toBN(clientServerHash);

    return {
        clientSecret,
        clientEphemeral,
        scramblingParam,
    };
};

/**
 * Get parameters. Loops until it finds safe values.
 */
const getParameters = async ({ len, generator, modulus, serverEphemeralArray }: GenerateParametersArgs) => {
    for (let i = 0; i < MAX_VALUE_ITERATIONS; ++i) {
        const { clientSecret, clientEphemeral, scramblingParam } = await generateParameters({
            len,
            generator,
            modulus,
            serverEphemeralArray,
        });

        if (scramblingParam.compare(ZERO_BN) === 0) {
            continue;
        }

        return {
            clientSecret,
            clientEphemeral,
            scramblingParam,
        };
    }
    throw new Error('Could not find safe parameters');
};

interface GenerateProofsArgs {
    len: number;
    modulusArray: Uint8Array;
    hashedPasswordArray: Uint8Array;
    serverEphemeralArray: Uint8Array;
}

export const generateProofs = async ({
    len,
    modulusArray,
    hashedPasswordArray,
    serverEphemeralArray,
}: GenerateProofsArgs) => {
    const modulusBn = toBN(modulusArray);
    if (modulusBn.bitLength !== len) {
        throw new Error('SRP modulus has incorrect size');
    }

    const generator = TWO_BN;

    const hashedArray = await srpHasher(mergeUint8Arrays([fromBN(len, generator), modulusArray]));

    const multiplierBn = toBN(hashedArray);
    const serverEphemeral = toBN(serverEphemeralArray);
    const hashedPassword = toBN(hashedPasswordArray);

    const modulus = new Modulus(modulusBn);
    const modulusMinusOne = modulus.subtract(ONE_BN);
    const multiplierReduced = modulus.reduce(multiplierBn);

    if (multiplierReduced.compare(ONE_BN) <= 0 || multiplierReduced.compare(modulusMinusOne) >= 0) {
        throw new Error('SRP multiplier is out of bounds');
    }

    if (generator.compare(ONE_BN) <= 0 || generator.compare(modulusMinusOne) >= 0) {
        throw new Error('SRP generator is out of bounds');
    }

    if (serverEphemeral.compare(ONE_BN) <= 0 || serverEphemeral.compare(modulusMinusOne) >= 0) {
        throw new Error('SRP server ephemeral is out of bounds');
    }

    const { clientSecret, clientEphemeral, scramblingParam } = await getParameters({
        len,
        generator,
        modulus,
        serverEphemeralArray,
    });

    let subtracted = serverEphemeral.subtract(
        modulus.reduce(modulus.power(generator, hashedPassword).multiply(multiplierReduced))
    );

    if (subtracted.compare(ZERO_BN) < 0) {
        subtracted = subtracted.add(modulus);
    }

    const exponent = scramblingParam.multiply(hashedPassword).add(clientSecret).divide(modulusMinusOne).remainder;

    const sharedSession = modulus.power(subtracted, exponent);

    const clientEphemeralArray = fromBN(len, clientEphemeral);
    const sharedSessionArray = fromBN(len, sharedSession);

    const clientProof = await srpHasher(
        mergeUint8Arrays([clientEphemeralArray, serverEphemeralArray, sharedSessionArray])
    );
    const expectedServerProof = await srpHasher(
        mergeUint8Arrays([clientEphemeralArray, clientProof, sharedSessionArray])
    );

    return {
        clientEphemeral: clientEphemeralArray,
        clientProof,
        expectedServerProof,
        sharedSession: sharedSessionArray,
    };
};

export const getSrp = async (
    { Version, Modulus: serverModulus, ServerEphemeral, Username, Salt }: AuthInfo,
    { username, password }: AuthCredentials,
    authVersion = Version
) => {
    if (!checkUsername(authVersion, username, Username)) {
        const error: any = new Error(
            'Please login with just your ProtonMail username (without @protonmail.com or @protonmail.ch).'
        );
        error.trace = false;
        throw error;
    }

    const modulusArray = await verifyAndGetModulus(serverModulus);
    const serverEphemeralArray = binaryStringToArray(decodeBase64(ServerEphemeral));

    const hashedPasswordArray = await hashPassword({
        version: authVersion,
        password,
        salt: authVersion < 3 ? undefined : decodeBase64(Salt),
        username: authVersion < 3 ? Username : undefined,
        modulus: modulusArray,
    });

    const { clientEphemeral, clientProof, expectedServerProof, sharedSession } = await generateProofs({
        len: SRP_LEN,
        modulusArray,
        hashedPasswordArray,
        serverEphemeralArray,
    });

    return {
        clientEphemeral: encodeBase64(arrayToBinaryString(clientEphemeral)),
        clientProof: encodeBase64(arrayToBinaryString(clientProof)),
        expectedServerProof: encodeBase64(arrayToBinaryString(expectedServerProof)),
        sharedSession,
    };
};

const generateVerifier = (len: number, hashedPassword: Uint8Array, modulus: Uint8Array) => {
    const generator = TWO_BN;

    const modulusBn = new Modulus(toBN(modulus));
    const hashedPasswordBn = toBN(hashedPassword);

    const verifier = modulusBn.power(generator, hashedPasswordBn);
    return fromBN(len, verifier);
};

export const getRandomSrpVerifier = async (
    { Modulus: serverModulus }: { Modulus: string },
    { username, password }: AuthCredentials,
    version = AUTH_VERSION
) => {
    const modulus = await verifyAndGetModulus(serverModulus);
    const salt = arrayToBinaryString(crypto.getRandomValues(new Uint8Array(10)));
    const hashedPassword = await hashPassword({
        version,
        username,
        password,
        salt,
        modulus,
    });

    const verifier = generateVerifier(SRP_LEN, hashedPassword, modulus);

    return {
        version,
        salt: encodeBase64(salt),
        verifier: encodeBase64(arrayToBinaryString(verifier)),
    };
};
