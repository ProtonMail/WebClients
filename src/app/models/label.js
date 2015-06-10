angular.module("proton.models.label", [])

.factory("Label", function($resource, authentication) {
    return $resource(
        authentication.baseURL + '/labels/:id',
        authentication.params({
            id: '@id'
        }), {
            // Apply labels
            apply: {
                method: 'put',
                isArray: true,
                url: authentication.baseURL + '/labels/apply/:id'
            },
            // Re-order labels
            order: {
                method: 'put',
                url: authentication.baseURL + '/labels/order'
            },
            // Remove label from list of message ids
            remove: {
                method: 'put',
                isArray: true,
                url: authentication.baseURL + '/labels/remove/:id'
            },
            // Update labels
            update: {
                method: 'put',
                url: authentication.baseURL + '/labels/:id'
            }
        }
    );
});
