import _ from 'lodash';
import { BigNumber, Modulus } from 'asmcrypto.js';
import { arrayToBinaryString, binaryStringToArray, decodeBase64, encodeBase64, verifyMessage } from 'pmcrypto';

import CONFIG from '../../config';
import { SRP_MODULUS_KEY, VERIFICATION_STATUS } from '../../constants';
import { getRandomValues } from '../../../helpers/webcrypto';

const { SIGNED_AND_VALID, NOT_SIGNED } = VERIFICATION_STATUS;

/* @ngInject */
function srp($http, passwords, url, authApi, handle10003) {
    /**
     * [generateProofs description]
     * @param  {Integer} len            Size of the proof (bytes length)
     * @param  {Function} hash          Create a hash Function:<Uint8Array>
     * @param  {Uint8Array} modulus
     * @param  {Uint8Array} hashedPassword
     * @param  {Uint8Array} serverEphemeral
     * @return {Object}
     */
    async function generateProofs(len, hash, modulus, hashedPassword, serverEphemeral) {
        function toBN(arr) {
            const reversed = new Uint8Array(arr.length);
            for (let i = 0; i < arr.length; i++) {
                reversed[arr.length - i - 1] = arr[i];
            }
            return BigNumber.fromArrayBuffer(reversed);
        }

        function fromBN(bn) {
            const arr = bn.toBytes();
            const reversed = new Uint8Array(len / 8);
            for (let i = 0; i < arr.length; i++) {
                reversed[arr.length - i - 1] = arr[i];
            }
            return reversed;
        }

        const generator = BigNumber.fromNumber(2);

        let multiplier = toBN(await hash(openpgp.util.concatUint8Array([fromBN(generator), modulus])));

        modulus = toBN(modulus);
        serverEphemeral = toBN(serverEphemeral);
        hashedPassword = toBN(hashedPassword);

        const modulusMinusOne = modulus.subtract(BigNumber.fromNumber(1));

        if (modulus.bitLength !== len) {
            return { Type: 'Error', Description: 'SRP modulus has incorrect size' };
        }

        modulus = new Modulus(modulus);
        multiplier = modulus.reduce(multiplier);

        if (multiplier.compare(BigNumber.fromNumber(1)) <= 0 || multiplier.compare(modulusMinusOne) >= 0) {
            return { Type: 'Error', Description: 'SRP multiplier is out of bounds' };
        }

        if (generator.compare(BigNumber.fromNumber(1)) <= 0 || generator.compare(modulusMinusOne) >= 0) {
            return { Type: 'Error', Description: 'SRP generator is out of bounds' };
        }

        if (serverEphemeral.compare(BigNumber.fromNumber(1)) <= 0 || serverEphemeral.compare(modulusMinusOne) >= 0) {
            return { Type: 'Error', Description: 'SRP server ephemeral is out of bounds' };
        }

        /* Unfortunately, this is too slow for common use

        // Check primality
        if (!new BN(2).toRed(reductionContext).redPow(modulusMinusOne).fromRed().eqn(1)) {
            return { "Type": "Error", "Description": "SRP modulus is not prime" };
        }

        // Check safe primality
        const halfModulus = modulus.shrn(1);
        const millerRabinRed = BN.red(halfModulus);
        for (var i = 0; i < 5; i++) {
            const base = toBN(webcrypto.getRandomValues(new Uint8Array(len / 8))).toRed(millerRabinRed);
            const power = base.redPow(halfModulus.shrn(1)).fromRed();
            if (!power.eqn(1) && !power.eq(halfModulus.subn(1))) {
                return { "Type": "Error", "Description": "SRP modulus is not a safe prime" };
            }
        }
*/

        let clientSecret, clientEphemeral, scramblingParam;
        do {
            do {
                clientSecret = toBN(getRandomValues(new Uint8Array(len / 8)));
            } while (clientSecret.compare(BigNumber.fromNumber(len * 2)) <= 0); // Very unlikely

            clientEphemeral = modulus.power(generator, clientSecret);
            scramblingParam = toBN(
                await hash(openpgp.util.concatUint8Array([fromBN(clientEphemeral), fromBN(serverEphemeral)]))
            );
        } while (scramblingParam.compare(BigNumber.fromNumber(0)) === 0); // Very unlikely

        let subtracted = serverEphemeral.subtract(
            modulus.reduce(modulus.power(generator, hashedPassword).multiply(multiplier))
        );
        if (subtracted.compare(BigNumber.fromNumber(0)) < 0) {
            subtracted = subtracted.add(modulus);
        }
        const exponent = scramblingParam
            .multiply(hashedPassword)
            .add(clientSecret)
            .divide(modulus.subtract(BigNumber.fromNumber(1))).remainder;
        const sharedSession = modulus.power(subtracted, exponent);

        const clientProof = await hash(
            openpgp.util.concatUint8Array([fromBN(clientEphemeral), fromBN(serverEphemeral), fromBN(sharedSession)])
        );
        const serverProof = await hash(
            openpgp.util.concatUint8Array([fromBN(clientEphemeral), clientProof, fromBN(sharedSession)])
        );

        return {
            Type: 'Success',
            ClientEphemeral: fromBN(clientEphemeral),
            ClientProof: clientProof,
            ExpectedServerProof: serverProof
        };
    }

    function generateVerifier(len, hashedPassword, modulus) {
        function toBN(arr) {
            const reversed = new Uint8Array(arr.length);
            for (let i = 0; i < arr.length; i++) {
                reversed[arr.length - i - 1] = arr[i];
            }
            return BigNumber.fromArrayBuffer(reversed);
        }

        function fromBN(bn) {
            const arr = bn.toBytes();
            const reversed = new Uint8Array(len / 8);
            for (let i = 0; i < arr.length; i++) {
                reversed[arr.length - i - 1] = arr[i];
            }
            return reversed;
        }

        const generator = BigNumber.fromNumber(2);

        modulus = new Modulus(toBN(modulus));
        hashedPassword = toBN(hashedPassword);

        const verifier = modulus.power(generator, hashedPassword);
        return fromBN(verifier);
    }

    function tryRequest(method, endpoint, req, creds, headers, fallbackAuthVersion) {
        return authInfo(creds.Username).then((resp) => {
            return tryAuth(resp, method, endpoint, req, creds, headers, fallbackAuthVersion);
        });
    }

    /**
     * Verify the modulus signature with the SRP public key
     * @param {Object} modulusParsed
     * @return {Promise}
     */
    async function verifyModulus(modulusParsed) {
        try {
            const publicKeys = await openpgp.key.readArmored(SRP_MODULUS_KEY);
            const { verified = NOT_SIGNED } = await verifyMessage({
                message: modulusParsed,
                publicKeys: publicKeys.keys
            });

            if (verified !== SIGNED_AND_VALID) {
                throw new Error();
            }
        } catch (e) {
            return Promise.reject({
                error_description: 'Unable to verify server identity'
            });
        }
    }

    async function tryAuth(infoResp, method, endpoint, req, creds, headers, fallbackAuthVersion) {
        function srpHasher(arr) {
            return passwords.expandHash(arrayToBinaryString(arr));
        }

        let proofs;
        let useFallback;

        const session = infoResp.data.SRPSession;

        const modulusParsed = await openpgp.cleartext.readArmored(infoResp.data.Modulus);
        await verifyModulus(modulusParsed);
        const modulus = binaryStringToArray(decodeBase64(modulusParsed.getText()));
        const serverEphemeral = binaryStringToArray(decodeBase64(infoResp.data.ServerEphemeral));

        let authVersion = infoResp.data.Version;
        useFallback = authVersion === 0;
        if (useFallback) {
            authVersion = fallbackAuthVersion;
        }

        if (authVersion < 3) {
            creds.Username = infoResp.data.Username;
            // See https://github.com/ProtonMail/Angular/issues/4332
            // return Promise.reject({ error_description: 'An unexpected error has occurred. Please log out and log back in to fix it.' });
        }

        if (
            (authVersion === 2 &&
                passwords.cleanUsername(creds.Username) !== passwords.cleanUsername(infoResp.data.Username)) ||
            (authVersion <= 1 && creds.Username.toLowerCase() !== infoResp.data.Username.toLowerCase())
        ) {
            return Promise.reject({
                error_description:
                    'Please login with just your ProtonMail username (without @protonmail.com or @protonmail.ch).'
            });
        }

        let salt = '';

        if (authVersion >= 3) {
            salt = decodeBase64(infoResp.data.Salt);
        }

        try {
            const hashed = await passwords.hashPassword({
                version: authVersion,
                password: creds.Password,
                salt,
                username: creds.Username,
                modulus
            });

            proofs = await generateProofs(2048, srpHasher, modulus, hashed, serverEphemeral);

            if (proofs.Type !== 'Success') {
                return Promise.reject({
                    error_description: proofs.Description
                });
            }
        } catch (err) {
            return Promise.reject({
                error_description: err.message
            });
        }

        const httpReq = {
            method,
            noNotify: true, // TODO: The SRP is all broken. It is going to be removed soon.
            url: url.get() + endpoint,
            data: _.extend(req, {
                SRPSession: session,
                ClientEphemeral: encodeBase64(arrayToBinaryString(proofs.ClientEphemeral)),
                ClientProof: encodeBase64(arrayToBinaryString(proofs.ClientProof)),
                TwoFactorCode: creds.TwoFactorCode
            })
        };

        if (angular.isDefined(headers)) {
            httpReq.headers = headers;
        }

        try {
            const resp = await $http(httpReq);

            if (encodeBase64(arrayToBinaryString(proofs.ExpectedServerProof)) === resp.data.ServerProof) {
                return Promise.resolve(_.extend(resp, { authVersion }));
            }
        } catch (error) {
            const { data = {} } = error || {};

            handle10003(data);

            if (data.Error) {
                return Promise.reject({
                    error_description: data.Error,
                    usedFallback: useFallback
                });
            }

            return Promise.reject(error);
        }
    }

    async function randomVerifier(password) {
        try {
            const { data = {} } = (await authApi.modulus()) || {};
            const modulusParsed = await openpgp.cleartext.readArmored(data.Modulus);
            await verifyModulus(modulusParsed);
            const modulus = binaryStringToArray(decodeBase64(modulusParsed.getText()));
            const salt = arrayToBinaryString(getRandomValues(new Uint8Array(10)));
            const hashedPassword = await passwords.hashPassword({
                version: passwords.currentAuthVersion,
                password,
                salt,
                modulus
            });

            const verifier = generateVerifier(2048, hashedPassword, modulus);

            return {
                Auth: {
                    Version: passwords.currentAuthVersion,
                    ModulusID: data.ModulusID,
                    Salt: encodeBase64(salt),
                    Verifier: encodeBase64(arrayToBinaryString(verifier))
                }
            };
        } catch (err) {
            const { data = {} } = err || {};

            if (data.Error) {
                return Promise.reject({
                    error_description: data.Error
                });
            }

            throw err;
        }
    }

    function authInfo(Username) {
        return authApi.info({
            Username,
            ClientID: CONFIG.clientID
        });
    }

    /**
     * Check the validity of a user
     * @param  {String} method          HTTP methods
     * @param  {String} endpoint        URL
     * @param  {Object} req             {Username:<String>, ClientID:<String>}
     * @param  {Object} creds           {Username:<String>, Password:<String>, TwoFactorCode:<Null>}
     * @param  {void} initialInfoResp
     * @param  {Object} headers
     * @return {Promise}
     */
    function performSRPRequest(method, endpoint, req, creds, initialInfoResp, headers) {
        let ret;
        if (initialInfoResp) {
            ret = tryAuth(initialInfoResp, method, endpoint, req, creds, headers, 2);
        } else {
            ret = tryRequest(method, endpoint, req, creds, headers, 2);
        }
        ret = ret.catch((err) => {
            if (err.usedFallback === true && passwords.cleanUsername(creds.Username) !== creds.Username.toLowerCase()) {
                return tryRequest(method, endpoint, req, creds, headers, 1);
            }
            return Promise.reject(err);
        });
        ret = ret.catch((err) => {
            if (err.usedFallback === true) {
                return tryRequest(method, endpoint, req, creds, headers, 0);
            }
            return Promise.reject(err);
        });
        return ret;
    }

    /**
     * Get the configuration available for a password, and extend your config with it
     * @param  {String} password
     * @param  {Object} config
     * @return {Promise}
     */
    function getPasswordParams(password, config = {}) {
        return randomVerifier(password).then((data) => _.extend({}, config, data));
    }

    return { randomVerifier, info: authInfo, performSRPRequest, getPasswordParams };
}
export default srp;
