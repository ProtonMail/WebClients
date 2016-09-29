angular.module("proton.srp", ["proton.webcrypto", "proton.passwords"])
.factory('srp', function(
    $http,
    $q,
    CONFIG,
    webcrypto,
    passwords,
    url
) {
    "use strict";

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
            for (var i = 0; i < arr.length; i++) {
                reversed[arr.length - i - 1] = arr[i];
            }
            return new asmCrypto_bn.BigNumber(reversed);
        }

        function fromBN(bn) {
            const arr = bn.toBytes();
            const reversed = new Uint8Array(len / 8);
            for (var i = 0; i < arr.length; i++) {
                reversed[arr.length - i - 1] = arr[i];
            }
            return reversed;
        }

        const generator = new asmCrypto_bn.BigNumber(2);

        var multiplier = toBN(hash(openpgp.util.concatUint8Array([fromBN(generator), modulus])));

        modulus = toBN(modulus);
        serverEphemeral = toBN(serverEphemeral);
        hashedPassword = toBN(hashedPassword);

        const modulusMinusOne = modulus.subtract(1);

        if (modulus.bitLength !== len) {
            return { "Type": "Error", "Description": "SRP modulus has incorrect size" };
        }

        modulus = new asmCrypto_bn.Modulus(modulus);
        multiplier = modulus.reduce(multiplier);

        if (multiplier.compare(1) <= 0 || multiplier.compare(modulusMinusOne) >= 0) {
            return { "Type": "Error", "Description": "SRP multiplier is out of bounds" };
        }

        if (generator.compare(1) <= 0 || generator.compare(modulusMinusOne) >= 0) {
            return { "Type": "Error", "Description": "SRP generator is out of bounds" };
        }

        if (serverEphemeral.compare(1) <= 0 || serverEphemeral.compare(modulusMinusOne) >= 0) {
            return { "Type": "Error", "Description": "SRP server ephemeral is out of bounds" };
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

        var clientSecret, clientEphemeral, scramblingParam;
        do {
            do {
                clientSecret = toBN(webcrypto.getRandomValues(new Uint8Array(len / 8)));
             } while (clientSecret.compare(len * 2) <= 0); // Very unlikely

             clientEphemeral = modulus.power(generator, clientSecret);
             scramblingParam = toBN(hash(openpgp.util.concatUint8Array([fromBN(clientEphemeral), fromBN(serverEphemeral)])));
        } while (scramblingParam.compare(0) === 0); // Very unlikely

        var subtracted = serverEphemeral.subtract(modulus.reduce(modulus.power(generator, hashedPassword).multiply(multiplier)));
        if (subtracted.compare(0) < 0) {
            subtracted = subtracted.add(modulus);
        }
        const exponent = scramblingParam.multiply(hashedPassword).add(clientSecret).divide(modulus.subtract(1)).remainder;
        const sharedSession = modulus.power(subtracted, exponent);

        const clientProof = hash(openpgp.util.concatUint8Array([fromBN(clientEphemeral), fromBN(serverEphemeral), fromBN(sharedSession)]));
        const serverProof = hash(openpgp.util.concatUint8Array([fromBN(clientEphemeral), clientProof, fromBN(sharedSession)]));

        return { "Type": "Success", "ClientEphemeral": fromBN(clientEphemeral), "ClientProof": clientProof, "ExpectedServerProof": serverProof};
    }

    function generateVerifier(len, hashedPassword, modulus) {
        function toBN(arr) {
            const reversed = new Uint8Array(arr.length);
            for (var i = 0; i < arr.length; i++) {
                reversed[arr.length - i - 1] = arr[i];
            }
            return new asmCrypto_bn.BigNumber(reversed);
        }

        function fromBN(bn) {
            const arr = bn.toBytes();
            const reversed = new Uint8Array(len / 8);
            for (var i = 0; i < arr.length; i++) {
                reversed[arr.length - i - 1] = arr[i];
            }
            return reversed;
        }

        const generator = new asmCrypto_bn.BigNumber(2);

        modulus = new asmCrypto_bn.Modulus(toBN(modulus));
        hashedPassword = toBN(hashedPassword);

        const verifier = modulus.power(generator, hashedPassword);
        return fromBN(verifier);
    }

    function tryRequest(method, endpoint, req, creds, headers, fallbackAuthVersion) {
        return api.info(creds.Username).then(function(resp) {
            return tryAuth(resp, method, endpoint, req, creds, headers, fallbackAuthVersion);
        });
    }

    function tryAuth(infoResp, method, endpoint, req, creds, headers, fallbackAuthVersion) {
        function srpHasher(arr) {
            return passwords.expandHash(pmcrypto.arrayToBinaryString(arr));
        }

        var proofs;
        var useFallback;

        const session = infoResp.data.SRPSession;
        const modulus = pmcrypto.binaryStringToArray(pmcrypto.decode_base64(openpgp.cleartext.readArmored(infoResp.data.Modulus).getText()));
        const serverEphemeral = pmcrypto.binaryStringToArray(pmcrypto.decode_base64(infoResp.data.ServerEphemeral));

        var authVersion = infoResp.data.Version;
        useFallback = authVersion === 0;
        if (useFallback) {
            authVersion = fallbackAuthVersion;
        }

        if (authVersion < 3 && !angular.isDefined(creds.Username)) {
            return $q.reject({
                error_description: "An unexpected error has occurred. Please log out and log back in to fix it."
            });
        }

        if (authVersion === 2 && passwords.cleanUserName(creds.Username) !== passwords.cleanUserName(infoResp.data.UserName) ||
            authVersion <= 1 && creds.Username.toLowerCase() !== infoResp.data.UserName.toLowerCase()) {
            return $q.reject({
                error_description: "Please login with your ProtonMail username. You will be able to use your email for future logins."
            });
        }

        var salt = "";
        if (authVersion >= 3) {
            salt = pmcrypto.decode_base64(infoResp.data.Salt);
        }

        return passwords.hashPassword(authVersion, creds.Password, salt, creds.Username, modulus).then(function(hashed) {
            proofs = generateProofs(
                2048,
                srpHasher,
                modulus,
                hashed,
                serverEphemeral
            );

            if (proofs.Type !== "Success") {
                return $q.reject({
                    error_description: proofs.Description
                });
            }

            const httpReq = {
                method: method,
                url: url.get() + endpoint,
                data: _.extend(req, {
                    SRPSession: session,
                    ClientEphemeral: pmcrypto.encode_base64(pmcrypto.arrayToBinaryString(proofs.ClientEphemeral)),
                    ClientProof: pmcrypto.encode_base64(pmcrypto.arrayToBinaryString(proofs.ClientProof)),
                    TwoFactorCode: creds.TwoFactorCode
                })
            };
            if (angular.isDefined(headers)) {
                httpReq.headers = headers;
            }

            return $http(httpReq);
        }, function(err) {
            return $q.reject({
                error_description: err.message
            });
        }).then(
            function(resp) {
                if (resp.data.Code !== 1000) {
                    return $q.reject({
                        error_description: resp.data.Error,
                        usedFallback: useFallback
                    });
                } else if (pmcrypto.encode_base64(pmcrypto.arrayToBinaryString(proofs.ExpectedServerProof)) === resp.data.ServerProof) {
                    return $q.resolve(_.extend(resp, { authVersion: authVersion }));
                } else {
                    return $q.reject({
                        error_description: "Invalid server authentication"
                    });
                }
            },
            function(error) {
                return $q.reject(error);
            }
        );
    }

    // RUN-TIME PUBLIC FUNCTIONS
    const api = {

        /**
         * Check the validity of a user
         * @param  {String} method          HTTP methods
         * @param  {String} endpoint        URL
         * @param  {Object} req             {Username:<String>, ClientID:<String>, ClientSecret:<String>}
         * @param  {Object} creds           {Username:<String>, Password:<String>, TwoFactorCode:<Null>}
         * @param  {void} initialInfoResp
         * @param  {Object} headers
         * @return {Promise}
         */
        performSRPRequest(method, endpoint, req, creds, initialInfoResp, headers) {
            var ret;
            if (initialInfoResp) {
                ret = tryAuth(initialInfoResp, method, endpoint, req, creds, headers, 2);
            } else {
                ret = tryRequest(method, endpoint, req, creds, headers, 2);
            }
            ret = ret.catch(function(err) {
                if (err.usedFallback === true && passwords.cleanUserName(creds.Username) !== creds.Username.toLowerCase()) {
                    return tryRequest(method, endpoint, req, creds, headers, 1);
                } else {
                    return $q.reject(err);
                }
            });
            ret = ret.catch(function(err) {
                if (err.usedFallback === true) {
                    return tryRequest(method, endpoint, req, creds, headers, 0);
                } else {
                    return $q.reject(err);
                }
            });
            return ret;
        },

        info: function(username) {
            return $http.post(
                url.get() + "/auth/info",
                {
                    Username: username,
                    ClientID: CONFIG.clientID,
                    ClientSecret: CONFIG.clientSecret
                }
            ).then(
                function(resp) {
                    if (resp.data.Code !== 1000) {
                        return $q.reject({
                            error_description: resp.data.Error
                        });
                    } else {
                        return resp;
                    }
                }
            );
        },

        randomVerifier: function(password) {
            return $http.get(url.get() + "/auth/modulus").then(function(resp) {
                if (resp.data.Code !== 1000) {
                    return $q.reject({
                        error_description: resp.data.Error
                    });
                }

                const modulus = pmcrypto.binaryStringToArray(pmcrypto.decode_base64(openpgp.cleartext.readArmored(resp.data.Modulus).getText()));
                const salt = pmcrypto.arrayToBinaryString(webcrypto.getRandomValues(new Uint8Array(10)));
                return passwords.hashPassword(passwords.currentAuthVersion, pmcrypto.encode_utf8(password), salt, undefined, modulus).then(function(hashedPassword) {
                    const verifier = generateVerifier(2048, hashedPassword, modulus);

                    return {
                        Auth: {
                            Version: passwords.currentAuthVersion,
                            ModulusID: resp.data.ModulusID,
                            Salt: pmcrypto.encode_base64(salt),
                            Verifier: pmcrypto.encode_base64(pmcrypto.arrayToBinaryString(verifier))
                        }
                    };
                });
            });
        }
    };

    return api;
});
