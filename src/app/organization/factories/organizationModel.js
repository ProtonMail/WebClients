angular.module('proton.organization')
    .factory('organizationModel', (organizationApi, setupKeys, authentication, $rootScope, gettextCatalog, CONSTANTS) => {

        let organization = {};
        const fakeOrganization = {
            PlanName: 'free',
            MaxMembers: 1,
            HasKeys: 0
        };
        const fakeResult = {
            data: {
                Code: 1000,
                Organization: fakeOrganization
            }
        };

        const I18N = {
            CREATE_ERROR: gettextCatalog.getString('Error during organization request', null, 'Error organization'),
            FETCH_ERROR: gettextCatalog.getString('Organization request failed', null, 'Error organization'),
            KEYS_ERROR: gettextCatalog.getString('Error during the generation of new organization keys', null, 'Error organization')
        };


        const get = () => organization;
        const set = (data = {}) => (organization = data);
        const clear = () => (organization = {});

        const isFreePlan = () => (organization || {}).PlanName === 'free';

        function fetch() {
            if (authentication.user.Role === CONSTANTS.FREE_USER_ROLE) {
                organization = fakeOrganization;
                return Promise.resolve(fakeResult);
            }
            return organizationApi.get()
                .then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        organization = data.Organization;
                        return data.Organization;
                    }
                    throw new Error(data.Error || I18N.FETCH_ERROR);
                });
        }

        function create() {

            if (!isFreePlan()) {
                return Promise.resolve();
            }

            generateKeys()
                .then(organizationApi.create)
                .then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        return data;
                    }
                    throw new Error(data.Error || I18N.CREATE_ERROR);
                }, () => {
                    throw new Error(I18N.CREATE_ERROR);
                });
        }

        function generateKeys() {

            if (!isFreePlan()) {
                return Promise.resolve();
            }

            return setupKeys.generateOrganization(authentication.getPassword())
                .then(({ privateKeyArmored: PrivateKey }) => ({ PrivateKey }))
                .catch(() => {
                    throw new Error(I18N.KEYS_ERROR);
                });
        }

        $rootScope.$on('organizationChange', (event, newOrganization) => {
            set(newOrganization);
        });
        return {
            set, get, clear, isFreePlan,
            fetch, create, generateKeys
        };
    });
