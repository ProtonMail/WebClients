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
         * Return the list of domains
         */
        query: function() {
            var deferred = $q.defer();

            deferred.resolve({
            "Domains": [
                {
                    "ID": "BKiAUbkGnUPiy2c3b0sBCK557OBnWD7ACqqX3VPoZqOOyeMdupoWcjrPDBHy3ANfFKHnJs6qdQrdvHj7zjon_g==",
                    "OrganizationID": "l8vWAXHBQmv0u7OVtPbcqMa4iwQaBqowINSQjPrxAr-Da8fVPKUkUcqAq30_BCxj1X0nW70HQRmAa-rIvzmKUA==",
                    "DomainName": "DingchaoLu.com",
                    "VerifyCode": "protonmail-verification=c701a28e2bdd3358c6dda71a3008b806e41950b0",
                    "MxRecord": "a:1:{i:0;a:2:{s:6:\"target\";s:17:\"mx.DingchaoLu.com\";s:3:\"pri\";i:30;}}",
                    "SpfRecord": "v=spf1 ip4:66.96.128.0/18 ?all",
                    "DkimRecord": null,
                    "DkimPublicKey": "v=DKIM1; k=rsa; p=lkajfelkajef",
                    "DmarcRecord": null,
                    "State": 1,
                    "CheckTime": 1445848850,
                    "VerifyState": 1,
                    "MxState": 1,
                    "SpfState": 1,
                    "DkimState": 1,
                    "DmarcState": 1
                },
                {
                    "ID": "FK4MKKIVJqOC9Pg_sAxCjNWf8PM9yGzrXO3eXq8sk5RJB6HtaRBNUEcnvJBrQVPAtrDSoTNq4Du3FpqIxyMhHQ==",
                    "OrganizationID": "l8vWAXHBQmv0u7OVtPbcqMa4iwQaBqowINSQjPrxAr-Da8fVPKUkUcqAq30_BCxj1X0nW70HQRmAa-rIvzmKUA==",
                    "DomainName": "funoccupied.com",
                    "VerifyCode": "protonmail-verification=1d439ec16a149d45b1e7b54ed57bf197b89ac1aa",
                    "MxRecord": "a:1:{i:0;a:2:{s:6:\"target\";s:18:\"mx.funoccupied.com\";s:3:\"pri\";i:30;}}",
                    "SpfRecord": "v=spf1 ip4:66.96.128.0/18 ?all",
                    "DkimRecord": null,
                    "DkimPublicKey": null,
                    "DmarcRecord": null,
                    "State": 0,
                    "CheckTime": 1445848852,
                    "VerifyState": 0,
                    "MxState": 0,
                    "SpfState": 0,
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

            return $http.get(url.get() + '/domains/' + id, Obj);
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
        delete: function(Obj) {
            var id = Obj.id;

            return $http.delete(url.get() + '/domains/' + id, Obj);
        }
    };
});
