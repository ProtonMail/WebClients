angular.module("proton.tempStorage", [])

.factory("tempStorage", ($timeout) => {
    // This is a very simple storage object wrapper which unlinks the reference to the data after retrieval
    // or a timeout, whichever happens first. It is designed to help ensure proper garbage collection of sensitive data.
    // It implements the secureSessionStorage interface, though it is not restricted to strings only.

    var data = {};

    var api = {
        getItem: function(key) {
            if (angular.isString(key) && data.hasOwnProperty(key)) {
                let rv = data[key];
                delete data[key];
                return rv;
            } else {
                return null;
            }
        },

        setItem: function(key, value, lifetime = 10000) {
            if (angular.isString(key)) {
                data[key] = value;

                // Delete information if no retrieved within timeout
                $timeout(() => {
                    delete data[key];
                }, lifetime);
            }
        },

        removeItem: function(key) {
            if (angular.isString(key) && data.hasOwnProperty(key)) {
                delete data[key];
            }
        },

        clear: function() {
            data = {};
        }
    };

    return api;
});
