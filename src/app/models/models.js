var getFromJSONResponse = function(name) {
    return function(data) {
        var obj;

        try {
            obj = JSON.parse(data);
        } catch (err) {
            console.error("JSON decoding error:", err, data);
            return {};
        }

        if (!obj.error && name) {
            return obj[name];
        }

        return obj;
    };
};

angular.module("proton.models", [
    "ngResource",
    "proton.authentication"
]);

