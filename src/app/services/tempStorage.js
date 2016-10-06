angular.module("proton.tempStorage", [])

.factory("tempStorage", ($timeout) => {
    // This is a very simple storage object wrapper which unlinks the reference to the data after retrieval
    // or a timeout, whichever happens first. It is designed to help ensure proper garbage collection of sensitive data.
    // It implements the secureSessionStorage interface, though it is not restricted to strings only.

    let data = {};
    let timeouts = {};

    function deleteKey(key) {
        return () => {
            delete data[key];
        };
    }

    function cancelTimeout(key) {
        if (timeouts[key]) {
            $timeout.cancel(timeouts[key]);
            delete timeouts[key];
        }
    }

    return {
        getItem: function(key) {
            if (angular.isString(key) && data.hasOwnProperty(key)) {

                cancelTimeout(key);

                let rv = data[key];
                deleteKey(key)();
                return rv;
            } else {
                return null;
            }
        },

        setItem: function(key, value, lifetime = 10000) {
            if (angular.isString(key)) {

                cancelTimeout(key);
                data[key] = value;

                // Delete information if not retrieved within timeout
                timeouts[key] = $timeout(deleteKey(key), lifetime);
            }
        },

        removeItem: function(key) {
            if (angular.isString(key) && data.hasOwnProperty(key)) {

                cancelTimeout(key);
                delete data[key];
            }
        },

        clear: function() {

            for (let key in timeouts) {
                cancelTimeout(key);
            }

            data = {};
        }
    };
});
