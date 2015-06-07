angular.module("proton.models.label", [])

.factory("Label", function($resource, $injector) {
    var authentication = $injector.get('authentication');

    return $resource(
        authentication.baseURL + '/labels/:id',
        authentication.params({
            id: '@id'
        }), {
            // Apply labels
            apply: {
                method: 'put',
                url: authentication.baseURL + '/labels/apply'
            },
            // Re-order labels
            order: {
                method: 'put',
                url: authentication.baseURL + '/labels/order'
            },
            // Remove label from list of message ids
            remove: {
                method: 'put',
                url: authentication.baseURL + '/labels/remove/:id'
            }
        }
    );
});
