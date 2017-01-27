angular.module('proton.organization')
.factory('organizationModel', (organizationApi, authentication, $rootScope, CONSTANTS) => {
    let organization = {};
    function get() {
        return organization;
    }
    function set(newOrganization = {}) {
        organization = newOrganization;
    }
    function fetch() {
        if (authentication.user.Role !== CONSTANTS.PAID_ADMIN_ROLE) {
            const fakeResult = {
                data: {
                    Code: 1000,
                    Organization: {
                        PlanName: 'free',
                        MaxMembers: 1,
                        HasKeys: 0
                    }
                }
            };
            return Promise.resolve(fakeResult);
        }
        return organizationApi.get()
        .then(({ data = {} } = {}) => {
            if (data.Code === 1000) {
                organization = data.Organization;
                return data.Organization;
            }
            throw new Error(data.Error || 'Organization request failed');
        });
    }
    function clear() {
        organization = {};
    }
    $rootScope.$on('organizationChange', (event, newOrganization) => {
        set(newOrganization);
    });
    return { set, get, fetch, clear };
});
