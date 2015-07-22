angular.module("proton.models.label", [])

.factory("Label", function($resource, $rootScope, authentication) {
    return $resource(
        $rootScope.baseURL + '/labels/:id',
        authentication.params({
            id: '@id'
        }), {
            // Apply labels
            apply: {
                method: 'put',
                url: $rootScope.baseURL + '/labels/apply/:id'
            },
            // Re-order labels
            order: {
                method: 'put',
                url: $rootScope.baseURL + '/labels/order'
            },
            // Remove label from list of message ids
            remove: {
                method: 'put',
                url: $rootScope.baseURL + '/labels/remove/:id'
            },
            // Update labels
            update: {
                method: 'put',
                url: $rootScope.baseURL + '/labels/:id'
            }
        }
    );
});
