angular.module('proton.sidebar')
    .factory('sidebarSettingsModel', (gettextCatalog) => {

        const getStateConfig = () => ({
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
                label: gettextCatalog.getString('Folders / Labels', null, 'Title'),
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
            signatures: {
                state: 'secured.signatures',
                label: gettextCatalog.getString('Name / Signature', null, 'Title'),
                icon: 'fa-at'
            },
            members: {
                state: 'secured.members',
                label: gettextCatalog.getString('Addresses / Users', null, 'Title'),
                icon: 'fa-users'
            },
            domains: {
                state: 'secured.domains',
                label: gettextCatalog.getString('Domains', null, 'Title'),
                icon: 'fa-globe'
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
            },
            vpn: {
                state: 'secured.vpn',
                label: gettextCatalog.getString('VPN', null, 'Title'),
                icon: 'fa-shield'
            }
        });

        return { getStateConfig };
    });
