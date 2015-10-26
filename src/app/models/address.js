angular.module("proton.models.addresses", [])

.factory("Address", function($http, $q, url) {
    return {
        // GET
        query: function() {
            var deferred = $q.defer();

            deferred.resolve({
                "Addresses": [
                    {
                        "AddressID": "UVhawo1URvrpvbnp1FaDO2RhoaENS5Ge8bJ4PT4U4ATqZeZTNGrVD1vM2JpeQP8tMMQQ9iqDEIz2u4werNZIRw==",
                        "Email": "boss@e-corp.com",
                        "DisplayName": "E-Corp CEO",
                        "Send": 0
                    },
                    {
                        "AddressID": "fT-fHNQexHafNYev4Qz49aetYhhjFOJCD8E8GYYOMY6o0U9WwINhnI76D9k7f6WB8_GaMISfd3a_cxe6vEUGxw==",
                        "Email": "max.mustermann@e-corp.com",
                        "DisplayName": "Max Mustermann",
                        "Send": 1
                    },
                    {
                        "AddressID": "hCjg4nXWswD5EhdgWrKr2xP3D-99QRPot3H3hg7yBfLZ9GOrjBEJuc3-rO7u-0WevfX4WSFcfgps8O3qKJAZxQ==",
                        "Email": "elliot@e-corp.com",
                        "DisplayName": "Elliot Alderson",
                        "Send": 0
                    },
                    {
                        "AddressID": "kBZYBzgHWtjW5igU33BXqwVZ66GBdJi4ycXPzZjyUmp840-O2yXyNEO0ayRveZKNnASS_btzUY-WkI_mcvNuOg==",
                        "Email": "security@e-corp.com",
                        "DisplayName": "Security",
                        "Send": 1
                    },
                    {
                        "AddressID": "dRs2Vv64Vru392SbvvG1MbEt3Ep5P_EWz8WbHVAOl_6h_Ty9jItyktkVcfz9-xRvCGwFq_TW7i8FtJaGyFEq0g==",
                        "DisplayName": "Mr. Robot",
                        "Email": "mr.r@fsociety.org",
                        "Send": 2
                    }
                ],
                "Code": 1000
            });

            return deferred.promise;
            // return $http.get(url.get() + '/addresses');
        },
        // POST
        /**
         * Add an address to a domain, returns {address_id} if successful, group address limit and usage
         */
        create: function(Obj) {
            return $http.post(url.get() + '/addresses', Obj);
        },
        // PUT
        /**
         * Assign address to a user / group member
         */
        update: function(Obj) {
            var id = Obj.id;

            return $http.put(url.get() + '/addresses/' + id, Obj);
        },
        // DELETE
        /**
         * Delete an address (alias), returns group address limit and usage
         */
        delete: function(Obj) {
            var id = Obj.id;

            return $http.delete(url.get() + '/addresses/' + id, Obj);
        }
    };
});
