angular.module('proton.organization')
.factory('organizationModel', (organizationApi) => {
    let organization = {};
    function get() {
        return organization;
    }
    function set(newOrganization = {}) {
        organization = newOrganization;
    }
    function fetch() {
        return organizationApi.get()
        .then(({ data = {} } = {}) => {
            if (data.Code === 1000) {
                organization = data.Organization;
                return data.Organization;
            }
            throw new Error(data.Error || 'Organization request failed');
        });
    }
    return { set, get, fetch };
});
