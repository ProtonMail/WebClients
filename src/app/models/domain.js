angular.module("proton.models.domains", [])

.factory("Domain", function($http, $q, url) {
    return {
        // POST
        /**
         * Create a domain of a given name
         */
        create: function(Obj) {
            return $http.post(url.get() + '/domains', Obj);
        },
        /**
         * Verify MX, SPF and DKIM records
         */
        verify: function(Obj) {
            var id = Obj.id;

            return $http.post(url.get() + '/domains/' + id, Obj);
        },
        // GET
        /**
         * Get all domains for this user's organization and check their DNS's
         */
        query: function() {
            var deferred = $q.defer();

            deferred.resolve({
            "Domains": [
                {
                    "ID": "BKiAUbkGnUPiy2c37zjon_g==",
                    "OrganizationID": "l8vWAXHBQmv0u7OzmKUA==",
                    "DomainName": "DingchaoLu.com",
                    "VerifyCode": "protonmail-verification=c701a28e2bdd3358c6dda71a3008b806e41950b0",
                    "MxRecord": "a:1:{i:0;a:2:{s:6:\"target\";s:18:\"mail.protonmail.ch\";s:3:\"pri\";i:10;}}",
                    "SpfRecord": "v=spf1 include:_spf.protonmail.ch a max ~all",
                    "DkimRecord": "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDKZ4rqzKDKrfJHKNfTgh1B/3NtoHrR8T4YXTuHltpFJlhc+GcjDEpf2tvzHnR7R7EbhOdiwy4SLgCXqEIRQe7swOT8vq5zPZ6/I50o8isxz50QlkvNoIWyeiNQqlDPQLQey0QXSfLznQY/bHxvKAqAi33CCHwS/OPuuWcHq8DCqQIDAQAB",
                    "DkimPublicKey": "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDKZ4rqzKDKrfJHKNfTgh1B/3NtoHrR8T4YXTuHltpFJlhc+GcjDEpf2tvzHnR7R7EbhOdiwy4SLgCXqEIRQe7swOT8vq5zPZ6/I50o8isxz50QlkvNoIWyeiNQqlDPQLQey0QXSfLznQY/bHxvKAqAi33CCHwS/OPuuWcHq8DCqQIDAQAB",
                    "DmarcRecord": "v=DMARC1; p=none; rua=mailto:postmaster@dingchaolu.com",
                    "State": 1,  // 0 is default, 1 is activated (verified and spf is not wrong)
                    "CheckTime": 1446095611,
                    "VerifyState": 2,   // 0 is default, 1 is has code but wrong, 2 is good
                    "MxState": 3,   // 0 is default, 1 and 2 has us but priority is wrong, 3 is good
                    "SpfState": 3,  // 0 is default, 1 and 2 means detected a record but wrong, 3 is good
                    "DkimState": 4,     // 0 is default, 1 and 2 means detected record but wrong, 3 means key is wrong, 4 is good
                    "DmarcState": 3    // 0 is default, 1 and 2 means detected record but wrong, 3 is good
                },
                {
                    "ID": "FK4MKKIVJqOC9Pg_sAxCjNWf8PM9yGzrXO3eXq8sk5RJB6HtaRBNUEcnvJBrQVPAtrDSoTNq4Du3FpqIxyMhHQ==",
                    "OrganizationID": "l8vWAXHBQmv0u7OVtPbcqMa4iwQaBqowINSQjPrxAr-Da8fVPKUkUcqAq30_BCxj1X0nW70HQRmAa-rIvzmKUA==",
                    "DomainName": "funoccupied.com",
                    "VerifyCode": "protonmail-verification=1d439ec16a149d45b1e7b54ed57bf197b89ac1aa",
                    "MxRecord": "a:3:{i:0;a:2:{s:6:\"target\";s:13:\"protonmail.ch\";s:3:\"pri\";i:1;}i:1;a:2:{s:6:\"target\";s:15:\"some.other.shit\";s:3:\"pri\";i:5;}i:2;a:2:{s:6:\"target\";s:18:\"mail.protonmail.ch\";s:3:\"pri\";i:10;}}",
                    "SpfRecord": "v=spf1 a max ~all",
                    "DkimRecord": null,
                    "DkimPublicKey": null,
                    "DmarcRecord": null,
                    "State": 0,
                    "CheckTime": 1446096501,
                    "VerifyState": 2,
                    "MxState": 1,
                    "SpfState": 1,
                    "DkimState": 0,
                    "DmarcState": 0
                }
            ],
            "Code": 1000
            });

            return deferred.promise;
            // return $http.get(url.get() + '/domains');
        },
        /**
         * Get domain info: domain name, list of addresses and associated users (AddressID, Email, DisplayName, UserID, User.DisplayName), verification status for MX, SPF, DKIM
         */
        get: function(Obj) {
            var id = Obj.id;
            var deferred = $q.defer();

            deferred.resolve({
                "Domain": {
                    "ID": "BKiAUbkGnUPiy2c3nJs6qdQrdvHj7zjon_g==",
                    "OrganizationID": "l8vWAXHBQ0_BCxj1X0nW70HQRmAa-rIvzmKUA==",
                    "DomainName": "DingchaoLu.com",
                    "VerifyCode": "protonmail-verification=c701a28e2bdd3358c6dda71a3008b806e41950b0",
                    "MxRecord": "a:1:{i:0;a:2:{s:6:\"target\";s:18:\"mail.protonmail.ch\";s:3:\"pri\";i:10;}}",
                    "SpfRecord": "v=spf1 include:_spf.protonmail.ch a max ~all",
                    "DkimRecord": "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDKZ4rqzKDKrfJHKNfTgh1B/3NtoHrR8T4YXTuHltpFJlhc+GcjDEpf2tvzHnR7R7EbhOdiwy4SLgCXqEIRQe7swOT8vq5zPZ6/I50o8isxz50QlkvNoIWyeiNQqlDPQLQey0QXSfLznQY/bHxvKAqAi33CCHwS/OPuuWcHq8DCqQIDAQAB",
                    "DkimPublicKey": "v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDKZ4rqzKDKrfJHKNfTgh1B/3NtoHrR8T4YXTuHltpFJlhc+GcjDEpf2tvzHnR7R7EbhOdiwy4SLgCXqEIRQe7swOT8vq5zPZ6/I50o8isxz50QlkvNoIWyeiNQqlDPQLQey0QXSfLznQY/bHxvKAqAi33CCHwS/OPuuWcHq8DCqQIDAQAB",
                    "DmarcRecord": "v=DMARC1; p=none; rua=mailto:postmaster@dingchaolu.com",
                    "State": 1,
                    "CheckTime": 1446099804,
                    "VerifyState": 2,
                    "MxState": 3,
                    "SpfState": 3,
                    "DkimState": 4,
                    "DmarcState": 3
                },
                "Code": 1000
            });

            return deferred.promise;
            // return $http.get(url.get() + '/domains/' + id, Obj);
        },
        // PUT
        /**
         * Update the domain name, add and delete addresses, set forwarding / MX record use
         */
        update: function(Obj) {
            var id = Obj.id;

            return $http.put(url.get() + '/domains/' + id, Obj);
        },
        // DELETE
        delete: function(domainid) {
            return $http.delete(url.get() + '/domains/' + domainid);
        }
    };
});
