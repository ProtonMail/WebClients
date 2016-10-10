angular.module('proton.models.domains', [])

.factory('Domain', ($http, $q, url) => {
    return {
        // POST
        /**
         * Create a domain of a given name
         */
        create(Obj) {
            return $http.post(url.get() + '/domains', Obj);
        },
        // GET
        /**
         * Get all domains for this user's organization and check their DNS's
         */
        query() {
            return $http.get(url.get() + '/domains');
        },
        /**
        * Return the list of domains available during the signing process
        */
        available() {
            return $http.get(url.get() + '/domains/available');
        },
        /**
         * Get domain info: domain name, list of addresses and associated users (AddressID, Email, DisplayName, UserID, User.DisplayName), verification status for MX, SPF, DKIM
         */
        get(id) {
            return $http.get(url.get() + '/domains/' + id);
        },
        // DELETE
        delete(id) {
            return $http.delete(url.get() + '/domains/' + id);
        }
    };
});
