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

            deferred.resolve([
                {
                    DomainID: 1, // int unsigned - PK
                    DomainName: 'panda.com', // varchar(253) - e.g. protonmail.ch, protonmail.com, ...
                    GroupID: 1, // int unsigned - the Group.GroupID owning this domain
                    State: true,
                    CheckTime: 123123123123, // - last time DNS was checked (need to recheck if more than 1 day old)
                    MX: {}, // json
                    MXStatus: true, // tinyint unsigned - encodes if PM is set with highest pref
                    SPF: {}, // json
                    SPFStatus: true, // tinyint unsigned - encodes if PM is included
                    DKIM: {}, // json
                    DKIMStatus: true, // tinyint unsigned - encodes if the protonmail selector public key is correct
                    DMARC: {}, // json
                    DMARCStatus: true // tinyint unsigned - encodes if not set, set but do nothing, quarantine, or reject
                },
                {
                    DomainID: 2, // int unsigned - PK
                    DomainName: 'tigre.com', // varchar(253) - e.g. protonmail.ch, protonmail.com, ...
                    GroupID: 1, // int unsigned - the Group.GroupID owning this domain
                    State: false,
                    CheckTime: 123123123123, // - last time DNS was checked (need to recheck if more than 1 day old)
                    MX: {}, // json
                    MXStatus: false, // tinyint unsigned - encodes if PM is set with highest pref
                    SPF: {}, // json
                    SPFStatus: false, // tinyint unsigned - encodes if PM is included
                    DKIM: {}, // json
                    DKIMStatus: false, // tinyint unsigned - encodes if the protonmail selector public key is correct
                    DMARC: {}, // json
                    DMARCStatus: false // tinyint unsigned - encodes if not set, set but do nothing, quarantine, or reject
                }
            ]);

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
