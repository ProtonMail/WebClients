import { BigNumber, Modulus } from 'asmcrypto.js/dist_es8/bignum/bignum';
import { concatArrays, arrayToBinaryString, binaryStringToArray, decodeBase64, encodeBase64 } from 'pmcrypto';
import getRandomValues from '@proton/get-random-values';

import { expandHash, hashPassword } from './passwords';
import { fromBN, toBN } from './utils/bigNumber';
import { checkUsername } from './utils/username';
import { verifyAndGetModulus } from './utils/modulus';
import { AUTH_VERSION, SRP_LEN, MAX_VALUE_ITERATIONS } from './constants';

const ZERO_BN = BigNumber.fromNumber(0);
const ONE_BN = BigNumber.fromNumber(1);
const TWO_BN = BigNumber.fromNumber(2);

/**
 * @param {Uint8Array} arr
 * @return {Promise<Uint8Array>}
 */
export const srpHasher = (arr) => expandHash(arr);

/**
 * Generate a random client secret.
 * @param {Number} len
 * @return {BigNumber}
 */
const generateClientSecret = (len) => toBN(getRandomValues(new Uint8Array(len / 8)));

/**
 * Get the client secret. Loops until it finds a safe value.
 * @param {Number} len
 * @return {BigNumber}
 */
const getClientSecret = (len) => {
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

/**
 * Generate parameters.
 * @param {Object} params
 * @param {Number} params.len
 * @param {BigNumber} params.generator
 * @param {BigNumber} params.modulus
 * @param {Uint8Array} params.serverEphemeralArray
 * @return {Promise<{clientSecret, clientEphemeral, scramblingParam}>}
 */
const generateParameters = async ({ len, generator, modulus, serverEphemeralArray }) => {
    const clientSecret = getClientSecret(len);
    const clientEphemeral = modulus.power(generator, clientSecret);
    const clientEphemeralArray = fromBN(len, clientEphemeral);

    const clientServerHash = await srpHasher(concatArrays([clientEphemeralArray, serverEphemeralArray]));
    const scramblingParam = toBN(clientServerHash);

    return {
        clientSecret,
        clientEphemeral,
        scramblingParam,
    };
};

/**
 * Get parameters. Loops until it finds safe values.
 * @param {Number} len
 * @param {BigNumber} generator
 * @param {BigNumber} modulus
 * @param {Uint8Array} serverEphemeralArray
 * @return {Promise<{clientSecret, clientEphemeral, scramblingParam}>}
 */
const getParameters = async ({ len, generator, modulus, serverEphemeralArray }) => {
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

/**
 * @param {Object} params
 * @param {Number} params.len - Size of the proof (bytes length)
 * @param {Uint8Array} params.modulusArray
 * @param {Uint8Array} params.hashedPasswordArray
 * @param {Uint8Array} params.serverEphemeralArray
 * @return {Promise}
 */
export const generateProofs = async ({ len, modulusArray, hashedPasswordArray, serverEphemeralArray }) => {
    const modulusBn = toBN(modulusArray);
    if (modulusBn.bitLength !== len) {
        throw new Error('SRP modulus has incorrect size');
    }

    const generator = TWO_BN;

    const hashedArray = await srpHasher(concatArrays([fromBN(len, generator), modulusArray]));

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

    const clientProof = await srpHasher(concatArrays([clientEphemeralArray, serverEphemeralArray, sharedSessionArray]));
    const expectedServerProof = await srpHasher(concatArrays([clientEphemeralArray, clientProof, sharedSessionArray]));

    return {
        clientEphemeral: clientEphemeralArray,
        clientProof,
        expectedServerProof,
        sharedSession: sharedSessionArray,
    };
};

/**
 * @param {Object} data - Auth info from the API
 * @param {String} data.Modulus - Base 64 encoded server modulus as a pgp signed message
 * @param {Number} data.Version - The auth version
 * @param {String} data.ServerEphemeral - Base64 encoded server ephemeral
 * @param {String} [data.Username] - The user name
 * @param {String} [data.Salt] - Base64 encoded salt
 * @param {Object} credentials - Credentials entered by the user
 * @param {String} [credentials.username] - Username entered
 * @param {String} credentials.password - Password entered
 * @param {Number} [authVersion] - The auth version
 * @return {Promise}
 */
export const getSrp = async (
    { Version, Modulus: serverModulus, ServerEphemeral, Username, Salt },
    { username, password },
    authVersion = Version
) => {
    if (!checkUsername(authVersion, username, Username)) {
        throw new Error('Please login with just your ProtonMail username (without @protonmail.com or @protonmail.ch).');
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

/**
 * @param {Number} len
 * @param {Uint8Array} hashedPassword
 * @param {Uint8Array} modulus
 * @return {Uint8Array}
 */
const generateVerifier = (len, hashedPassword, modulus) => {
    const generator = TWO_BN;

    const modulusBn = new Modulus(toBN(modulus));
    const hashedPasswordBn = toBN(hashedPassword);

    const verifier = modulusBn.power(generator, hashedPasswordBn);
    return fromBN(len, verifier);
};

/**
 * @param {Object} data - Modulus data from the API
 * @param {String} data.Modulus - Base 64 encoded server modulus as a pgp signed message
 * @param {Object} credentials - Credentials data as entered by the user
 * @param {String} [credentials.username] - Not needed if the auth version is >= 3
 * @param {String} credentials.password
 * @param {Number} [version] - Auth version
 * @return {Promise}
 */
export const getRandomSrpVerifier = async (
    { Modulus: serverModulus },
    { username, password },
    version = AUTH_VERSION
) => {
    const modulus = await verifyAndGetModulus(serverModulus);
    const salt = arrayToBinaryString(getRandomValues(new Uint8Array(10)));
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
