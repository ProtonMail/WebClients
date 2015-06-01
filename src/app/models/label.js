angular.module("proton.models.label", [])

.factory("Label", function($resource, $injector) {
    var authentication = $injector.get("authentication");
    return $resource(
        authentication.baseURL + "/labels/:LabelID",
        authentication.params({
            LabelID: "@LabelID"
        }), {
            // Get user's labels
            get: {
                method: 'get',
                isArray: true,
                url: authentication.baseURL + "/labels"
            },
            // Get all messages with this label
            messages: {
                method: 'get',
                isArray: false,
                url: authentication.baseURL + "/label"
            },
            // Create a new label
            create: {
                method: 'post',
                url: authentication.baseURL + "/labels/create"
            },
            // Edit label
            edit: {
                method: 'put',
                url: authentication.baseURL + "/labels/edit"
            },
            // Delete label
            delete: {
                method: 'delete'
            },
            // Apply labels
            apply: {
                method: 'put',
                url: authentication.baseURL + "/labels/apply"
            },
            // Re-order labels
            order: {
                method: 'put',
                url: authentication.baseURL + "/labels/order"
            }
        }
    );
});
