angular.module("proton.tempStorage", [])

.factory("tempStorage", () => {
    // This is a very simple storage object wrapper which unlinks the reference to the data after retrieval
    // It is designed to help ensure proper garbage collection of sensitive data
    // It implements the secureSessionStorage interface

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

        setItem: function(key, value) {
            if (angular.isString(key)) {
                data[key] = value;
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
