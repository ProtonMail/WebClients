import _ from 'lodash';

/* @ngInject */
function srp($http, CONFIG, webcrypto, passwords, url, authApi, handle10003) {
    /**
     * [generateProofs description]
     * @param  {Integer} len            Size of the proof (bytes length)
     * @param  {Function} hash          Create a hash Function:<Uint8Array>
     * @param  {Uint8Array} modulus
     * @param  {Uint8Array} hashedPassword
     * @param  {Uint8Array} serverEphemeral
     * @return {Object}
     */
    function generateProofs(len, hash, modulus, hashedPassword, serverEphemeral) {
        function toBN(arr) {
            const reversed = new Uint8Array(arr.length);
            for (let i = 0; i < arr.length; i++) {
                reversed[arr.length - i - 1] = arr[i];
            }
            return new asmCrypto.BigNumber(reversed);
        }

        function fromBN(bn) {
            const arr = bn.toBytes();
            const reversed = new Uint8Array(len / 8);
            for (let i = 0; i < arr.length; i++) {
                reversed[arr.length - i - 1] = arr[i];
            }
            return reversed;
        }

        const generator = new asmCrypto.BigNumber(2);

        let multiplier = toBN(hash(openpgp.util.concatUint8Array([fromBN(generator), modulus])));

        modulus = toBN(modulus);
        serverEphemeral = toBN(serverEphemeral);
        hashedPassword = toBN(hashedPassword);

        const modulusMinusOne = modulus.subtract(1);

        if (modulus.bitLength !== len) {
            return { Type: 'Error', Description: 'SRP modulus has incorrect size' };
        }

        modulus = new asmCrypto.Modulus(modulus);
        multiplier = modulus.reduce(multiplier);

        if (multiplier.compare(1) <= 0 || multiplier.compare(modulusMinusOne) >= 0) {
            return { Type: 'Error', Description: 'SRP multiplier is out of bounds' };
        }

        if (generator.compare(1) <= 0 || generator.compare(modulusMinusOne) >= 0) {
            return { Type: 'Error', Description: 'SRP generator is out of bounds' };
        }

        if (serverEphemeral.compare(1) <= 0 || serverEphemeral.compare(modulusMinusOne) >= 0) {
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
                clientSecret = toBN(webcrypto.getRandomValues(new Uint8Array(len / 8)));
            } while (clientSecret.compare(len * 2) <= 0); // Very unlikely

            clientEphemeral = modulus.power(generator, clientSecret);
            scramblingParam = toBN(
                hash(openpgp.util.concatUint8Array([fromBN(clientEphemeral), fromBN(serverEphemeral)]))
            );
        } while (scramblingParam.compare(0) === 0); // Very unlikely

        let subtracted = serverEphemeral.subtract(
            modulus.reduce(modulus.power(generator, hashedPassword).multiply(multiplier))
        );
        if (subtracted.compare(0) < 0) {
            subtracted = subtracted.add(modulus);
        }
        const exponent = scramblingParam
            .multiply(hashedPassword)
            .add(clientSecret)
            .divide(modulus.subtract(1)).remainder;
        const sharedSession = modulus.power(subtracted, exponent);

        const clientProof = hash(
            openpgp.util.concatUint8Array([fromBN(clientEphemeral), fromBN(serverEphemeral), fromBN(sharedSession)])
        );
        const serverProof = hash(
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
            return new asmCrypto.BigNumber(reversed);
        }

        function fromBN(bn) {
            const arr = bn.toBytes();
            const reversed = new Uint8Array(len / 8);
            for (let i = 0; i < arr.length; i++) {
                reversed[arr.length - i - 1] = arr[i];
            }
            return reversed;
        }

        const generator = new asmCrypto.BigNumber(2);

        modulus = new asmCrypto.Modulus(toBN(modulus));
        hashedPassword = toBN(hashedPassword);

        const verifier = modulus.power(generator, hashedPassword);
        return fromBN(verifier);
    }

    function tryRequest(method, endpoint, req, creds, headers, fallbackAuthVersion) {
        return authInfo(creds.Username).then((resp) => {
            return tryAuth(resp, method, endpoint, req, creds, headers, fallbackAuthVersion);
        });
    }

    function tryAuth(infoResp, method, endpoint, req, creds, headers, fallbackAuthVersion) {
        function srpHasher(arr) {
            return passwords.expandHash(pmcrypto.arrayToBinaryString(arr));
        }

        let proofs;
        let useFallback;

        const session = infoResp.data.SRPSession;
        const modulus = pmcrypto.binaryStringToArray(
            pmcrypto.decode_base64(openpgp.cleartext.readArmored(infoResp.data.Modulus).getText())
        );
        const serverEphemeral = pmcrypto.binaryStringToArray(pmcrypto.decode_base64(infoResp.data.ServerEphemeral));

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
            salt = pmcrypto.decode_base64(infoResp.data.Salt);
        }

        return passwords
            .hashPassword(authVersion, creds.Password, salt, creds.Username, modulus)
            .then(
                (hashed) => {
                    proofs = generateProofs(2048, srpHasher, modulus, hashed, serverEphemeral);

                    if (proofs.Type !== 'Success') {
                        return Promise.reject({
                            error_description: proofs.Description
                        });
                    }

                    const httpReq = {
                        method,
                        noNotify: true, // TODO: The SRP is all broken. It is going to be removed soon.
                        url: url.get() + endpoint,
                        data: _.extend(req, {
                            SRPSession: session,
                            ClientEphemeral: pmcrypto.encode_base64(
                                pmcrypto.arrayToBinaryString(proofs.ClientEphemeral)
                            ),
                            ClientProof: pmcrypto.encode_base64(pmcrypto.arrayToBinaryString(proofs.ClientProof)),
                            TwoFactorCode: creds.TwoFactorCode
                        })
                    };
                    if (angular.isDefined(headers)) {
                        httpReq.headers = headers;
                    }

                    return $http(httpReq);
                },
                (err) => {
                    return Promise.reject({
                        error_description: err.message
                    });
                }
            )
            .then(
                (resp) => {
                    if (
                        pmcrypto.encode_base64(pmcrypto.arrayToBinaryString(proofs.ExpectedServerProof)) ===
                        resp.data.ServerProof
                    ) {
                        return Promise.resolve(_.extend(resp, { authVersion }));
                    }

                    return Promise.reject({
                        error_description: 'Invalid server authentication'
                    });
                },
                (error) => {
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
            );
    }

    function randomVerifier(password) {
        return authApi
            .modulus()
            .then(({ data = {} } = {}) => {
                const modulus = pmcrypto.binaryStringToArray(
                    pmcrypto.decode_base64(openpgp.cleartext.readArmored(data.Modulus).getText())
                );
                const salt = pmcrypto.arrayToBinaryString(webcrypto.getRandomValues(new Uint8Array(10)));
                return passwords
                    .hashPassword(passwords.currentAuthVersion, password, salt, undefined, modulus)
                    .then((hashedPassword) => {
                        const verifier = generateVerifier(2048, hashedPassword, modulus);

                        return {
                            Auth: {
                                Version: passwords.currentAuthVersion,
                                ModulusID: data.ModulusID,
                                Salt: pmcrypto.encode_base64(salt),
                                Verifier: pmcrypto.encode_base64(pmcrypto.arrayToBinaryString(verifier))
                            }
                        };
                    });
            })
            .catch((err = {}) => {
                const { data = {} } = err;
                if (data.Error) {
                    return Promise.reject({
                        error_description: data.Error
                    });
                }
                throw err;
            });
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
