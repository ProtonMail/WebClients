angular.module("proton.models.label", [])

.factory("Label", function($resource, url, authentication) {
    return $resource(
        url.get() + '/labels/:id',
        authentication.params({
            id: '@id'
        }), {
            // Apply labels
            apply: {
                method: 'put',
                url: url.get() + '/labels/apply/:id'
            },
            // Re-order labels
            order: {
                method: 'put',
                url: url.get() + '/labels/order'
            },
            // Remove label from list of message ids
            remove: {
                method: 'put',
                url: url.get() + '/labels/remove/:id'
            },
            // Update labels
            update: {
                method: 'put',
                url: url.get() + '/labels/:id'
            }
        }
    );
});
