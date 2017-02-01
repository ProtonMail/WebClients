angular.module('proton.sidebar')
    .factory('sidebarSettingsModel', (gettextCatalog) => {

        const CONFIG = {
            dashboard: {
                state: 'secured.dashboard',
                label: gettextCatalog.getString('Dashboard', null, 'Title'),
                icon: 'fa-tachometer'
            },
            account: {
                state: 'secured.account',
                label: gettextCatalog.getString('Account', null, 'Title'),
                icon: 'fa-user'
            },
            labels: {
                state: 'secured.labels',
                label: gettextCatalog.getString('Labels', null, 'Title'),
                icon: 'fa-tags'
            },
            filters: {
                state: 'secured.filters',
                label: gettextCatalog.getString('Filters', null, 'Title'),
                icon: 'fa-filter'
            },
            security: {
                state: 'secured.security',
                label: gettextCatalog.getString('Security', null, 'Title'),
                icon: 'fa-lock'
            },
            appearance: {
                state: 'secured.appearance',
                label: gettextCatalog.getString('Appearance', null, 'Title'),
                icon: 'fa-paint-brush'
            },
            addresses: {
                state: 'secured.addresses',
                label: gettextCatalog.getString('Addresses', null, 'Title'),
                icon: 'fa-at'
            },
            domains: {
                state: 'secured.domains',
                label: gettextCatalog.getString('Domains', null, 'Title'),
                icon: 'fa-globe'
            },
            members: {
                state: 'secured.members',
                label: gettextCatalog.getString('Members', null, 'Title'),
                icon: 'fa-users'
            },
            payments: {
                state: 'secured.payments',
                label: gettextCatalog.getString('Payments', null, 'Title'),
                icon: 'fa-credit-card'
            },
            keys: {
                state: 'secured.keys',
                label: gettextCatalog.getString('Keys', null, 'Title'),
                icon: 'fa-key'
            }
        };

        const getStateConfig = () => CONFIG;

        return { getStateConfig };
    });
