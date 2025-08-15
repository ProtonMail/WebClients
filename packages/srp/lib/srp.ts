import {
    byteLength as bigIntByteLength,
    bigIntToUint8Array,
    mod,
    modExp,
    uint8ArrayToBigInt,
} from '@proton/crypto/lib/bigInteger';
import { arrayToBinaryString, binaryStringToArray, decodeBase64, encodeBase64 } from '@proton/crypto/lib/utils';
import mergeUint8Arrays from '@proton/utils/mergeUint8Arrays';

import { AUTH_VERSION, MAX_VALUE_ITERATIONS, SRP_LEN } from './constants';
import type { AuthCredentials, AuthInfo } from './interface';
import { expandHash, hashPassword } from './passwords';
import { verifyAndGetModulus } from './utils/modulus';
import { checkUsername } from './utils/username';

export const srpHasher = (arr: Uint8Array<ArrayBuffer>) => expandHash(arr);

const littleEndianArrayToBigInteger = async (arr: Uint8Array<ArrayBuffer>) => uint8ArrayToBigInt(arr.slice().reverse());

/**
 * Generate a random client secret.
 */
const generateClientSecret = (length: number) => {
    // treating the randomness as little-endian is needed for tests to work with the mocked random values
    return littleEndianArrayToBigInteger(crypto.getRandomValues(new Uint8Array(length)));
};

interface GenerateParametersArgs {
    byteLength: number;
    generator: bigint;
    modulus: bigint;
    serverEphemeralArray: Uint8Array<ArrayBuffer>;
}

const generateParameters = async ({ byteLength, generator, modulus, serverEphemeralArray }: GenerateParametersArgs) => {
    const clientSecret = await generateClientSecret(byteLength);
    const clientEphemeral = modExp(generator, clientSecret, modulus);
    const clientEphemeralArray = bigIntToUint8Array(clientEphemeral, 'le', byteLength);

    const clientServerHash = await srpHasher(mergeUint8Arrays([clientEphemeralArray, serverEphemeralArray]));
    const scramblingParam = await littleEndianArrayToBigInteger(clientServerHash);

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

        if (scramblingParam === BigInt(0) || clientEphemeral === BigInt(0)) {
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
    modulusArray: Uint8Array<ArrayBuffer>;
    hashedPasswordArray: Uint8Array<ArrayBuffer>;
    serverEphemeralArray: Uint8Array<ArrayBuffer>;
}

export const generateProofs = async ({
    byteLength,
    modulusArray,
    hashedPasswordArray,
    serverEphemeralArray,
}: GenerateProofsArgs) => {
    const modulus = await littleEndianArrayToBigInteger(modulusArray);
    if (bigIntByteLength(modulus) !== byteLength) {
        throw new Error('SRP modulus has incorrect size');
    }

    /**
     * The following is a description of SRP-6a, the latest versions of SRP (from srp.stanford.edu/design.html):
     *
     *   N    A large safe prime (N = 2q+1, where q is prime)
     *        All arithmetic is done modulo N.
     *   g    A generator modulo N
     *   k    Multiplier parameter (k = H(N, g)
     *   s    User's salt
     *   I    Username
     *   p    Cleartext Password
     *   H()  One-way hash function
     *   ^    (Modular) Exponentiation
     *   u    Random scrambling parameter
     *   a,b  Secret ephemeral values
     *   A,B  Public ephemeral values
     *   x    Private key (derived from p and s)
     *   v    Password verifier
     * The host stores passwords using the following formula:
     *   x = H(s, p)               (s is chosen randomly)
     *   v = g^x                   (computes password verifier)
     * The host then keeps {I, s, v} in its password database. The authentication protocol itself goes as follows:
     * User -> Host:  I, A = g^a                  (identifies self, a = random number)
     * Host -> User:  s, B = kv + g^b             (sends salt, b = random number)
     *
     *         Both:  u = H(A, B)
     *
     *         User:  x = H(s, p)                 (user enters password)
     *         User:  S = (B - kg^x) ^ (a + ux)   (computes session key)
     *         User:  K = H(S)
     *
     *         Host:  S = (Av^u) ^ b              (computes session key)
     *         Host:  K = H(S)
     *
     * Now the two parties have a shared, strong session key K.
     * To complete authentication, they need to prove to each other that their keys match. One possible way:
     * User -> Host:  M = H(H(N) xor H(g), H(I), s, A, B, K)
     * Host -> User:  H(A, M, K)
     *
     * The two parties also employ the following safeguards:
     * The user will abort if he receives B == 0 (mod N) or u == 0.
     * The host will abort if it detects that A == 0 (mod N).
     */

    const generator = BigInt(2);
    const hashedArray = await srpHasher(
        mergeUint8Arrays([bigIntToUint8Array(generator, 'le', byteLength), modulusArray])
    );

    const multiplier = await littleEndianArrayToBigInteger(hashedArray);
    const serverEphemeral = await littleEndianArrayToBigInteger(serverEphemeralArray);
    const hashedPassword = await littleEndianArrayToBigInteger(hashedPasswordArray);

    const modulusMinusOne = modulus - BigInt(1);
    const multiplierReduced = mod(multiplier, modulus);

    if (serverEphemeral === BigInt(0)) {
        throw new Error('SRP server ephemeral is out of bounds');
    }

    const { clientSecret, clientEphemeral, scramblingParam } = await getParameters({
        byteLength,
        generator,
        modulus,
        serverEphemeralArray,
    });

    const kgx = mod(modExp(generator, hashedPassword, modulus) * multiplierReduced, modulus);
    const sharedSessionKeyExponent = mod(scramblingParam * hashedPassword + clientSecret, modulusMinusOne);
    const sharedSessionKeyBase = mod(serverEphemeral - kgx, modulus);
    const sharedSessionKey = modExp(sharedSessionKeyBase, sharedSessionKeyExponent, modulus);

    const clientEphemeralArray = bigIntToUint8Array(clientEphemeral, 'le', byteLength);
    const sharedSessionArray = bigIntToUint8Array(sharedSessionKey, 'le', byteLength);

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

const generateVerifier = async (byteLength: number, hashedPasswordBytes: Uint8Array<ArrayBuffer>, modulusBytes: Uint8Array<ArrayBuffer>) => {
    const generator = BigInt(2);

    const modulus = await littleEndianArrayToBigInteger(modulusBytes);
    const hashedPassword = await littleEndianArrayToBigInteger(hashedPasswordBytes);

    const verifier = modExp(generator, hashedPassword, modulus);
    return bigIntToUint8Array(verifier, 'le', byteLength);
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
