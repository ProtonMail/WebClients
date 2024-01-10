import { arrayToBinaryString, binaryStringToArray, decodeBase64, encodeBase64 } from '@proton/crypto/lib/utils';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import { AUTH_VERSION, MAX_VALUE_ITERATIONS, SRP_LEN } from './constants';
import { AuthCredentials, AuthInfo } from './interface';
import { expandHash, hashPassword } from './passwords';
import { BigIntegerInstance, getBigInteger, littleEndianArrayToBigInteger } from './utils/bigInteger';
import { verifyAndGetModulus } from './utils/modulus';
import { checkUsername } from './utils/username';

export const srpHasher = (arr: Uint8Array) => expandHash(arr);

/**
 * Generate a random client secret.
 */
const generateClientSecret = async (length: number) => {
    const BigInteger = await getBigInteger();

    // treating the randomness as little-endian is needed for tests to work with the mocked random values
    return littleEndianArrayToBigInteger(crypto.getRandomValues(new Uint8Array(length)), BigInteger);
};

interface GenerateParametersArgs {
    byteLength: number;
    generator: BigIntegerInstance;
    modulus: BigIntegerInstance;
    serverEphemeralArray: Uint8Array;
}

const generateParameters = async ({ byteLength, generator, modulus, serverEphemeralArray }: GenerateParametersArgs) => {
    const BigInteger = await getBigInteger();

    const clientSecret = await generateClientSecret(byteLength);
    const clientEphemeral = generator.modExp(clientSecret, modulus);
    const clientEphemeralArray = clientEphemeral.toUint8Array('le', byteLength);

    const clientServerHash = await srpHasher(mergeUint8Arrays([clientEphemeralArray, serverEphemeralArray]));
    const scramblingParam = littleEndianArrayToBigInteger(clientServerHash, BigInteger);

    return {
        clientSecret,
        clientEphemeral,
        scramblingParam,
    };
};

/**
 * Get parameters. Loops until it finds safe values.
 */
const getParameters = async ({ byteLength, generator, modulus, serverEphemeralArray }: GenerateParametersArgs) => {
    for (let i = 0; i < MAX_VALUE_ITERATIONS; ++i) {
        const { clientSecret, clientEphemeral, scramblingParam } = await generateParameters({
            byteLength,
            generator,
            modulus,
            serverEphemeralArray,
        });

        if (scramblingParam.isZero()) {
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
    byteLength: number;
    modulusArray: Uint8Array;
    hashedPasswordArray: Uint8Array;
    serverEphemeralArray: Uint8Array;
}

export const generateProofs = async ({
    byteLength,
    modulusArray,
    hashedPasswordArray,
    serverEphemeralArray,
}: GenerateProofsArgs) => {
    const BigInteger = await getBigInteger();
    const modulus = littleEndianArrayToBigInteger(modulusArray, BigInteger);
    if (modulus.byteLength() !== byteLength) {
        throw new Error('SRP modulus has incorrect size');
    }

    const generator = new BigInteger(2);
    const hashedArray = await srpHasher(mergeUint8Arrays([generator.toUint8Array('le', byteLength), modulusArray]));

    const multiplier = littleEndianArrayToBigInteger(hashedArray, BigInteger);
    const serverEphemeral = littleEndianArrayToBigInteger(serverEphemeralArray, BigInteger);
    const hashedPassword = littleEndianArrayToBigInteger(hashedPasswordArray, BigInteger);

    const modulusMinusOne = modulus.dec();
    const multiplierReduced = multiplier.mod(modulus);

    if (multiplierReduced.isZero() || multiplierReduced.isOne() || multiplierReduced.gte(modulusMinusOne)) {
        throw new Error('SRP multiplier is out of bounds');
    }

    if (generator.isZero() || generator.isOne() || generator.gte(modulusMinusOne)) {
        throw new Error('SRP generator is out of bounds');
    }

    if (serverEphemeral.isZero() || serverEphemeral.isOne() || serverEphemeral.gte(modulusMinusOne)) {
        throw new Error('SRP server ephemeral is out of bounds');
    }

    const { clientSecret, clientEphemeral, scramblingParam } = await getParameters({
        byteLength,
        generator,
        modulus,
        serverEphemeralArray,
    });

    const kgx = generator.modExp(hashedPassword, modulus).imul(multiplierReduced).imod(modulus);
    const tExponent = scramblingParam.imul(hashedPassword).iadd(clientSecret).imod(modulusMinusOne);
    const tBase = serverEphemeral.sub(kgx).imod(modulus);
    const sharedSession = tBase.modExp(tExponent, modulus);

    const clientEphemeralArray = clientEphemeral.toUint8Array('le', byteLength);
    const sharedSessionArray = sharedSession.toUint8Array('le', byteLength);

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
        byteLength: SRP_LEN,
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

const generateVerifier = async (byteLength: number, hashedPasswordBytes: Uint8Array, modulusBytes: Uint8Array) => {
    const BigInteger = await getBigInteger();

    const generator = new BigInteger(2);

    const modulus = littleEndianArrayToBigInteger(modulusBytes, BigInteger);
    const hashedPassword = littleEndianArrayToBigInteger(hashedPasswordBytes, BigInteger);

    const verifier = generator.modExp(hashedPassword, modulus);
    return verifier.toUint8Array('le', byteLength);
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

    const verifier = await generateVerifier(SRP_LEN, hashedPassword, modulus);

    return {
        version,
        salt: encodeBase64(salt),
        verifier: encodeBase64(arrayToBinaryString(verifier)),
    };
};
