angular.module('proton.dashboard')
    .factory('dashboardOptions', (gettextCatalog, CONSTANTS) => {

        const { MAX_MEMBER } = CONSTANTS;
        const ADDRESS_OPTIONS = _.range(5, 51, 5).map((value, index) => ({ label: gettextCatalog.getString('{{value}} Addresses', { value }), value: index }));
        const SPACE_OPTIONS = _.range(5, 21).map((value, index) => ({ label: gettextCatalog.getPlural(value, '1 GB Storage', '{{$count}} GB Storage', {}), value: index }));
        const MEMBER_OPTIONS = _.range(1, MAX_MEMBER + 1).map((value, index) => ({ label: gettextCatalog.getPlural(value, '1 User', '{{$count}} Users', {}), value: index }));
        const generateDomains = (start, end) => _.range(start, end).map((value, index) => ({ label: gettextCatalog.getPlural(value, '1 Custom Domain', '{{$count}} Custom Domains', {}), value: index }));

        const VPN_OPTIONS = [
            { label: '----------', value: 'none' },
            { label: 'Basic', value: 'vpnbasic' },
            { label: 'Plus', value: 'vpnplus' }
        ];

        const options = {
            free: {
                vpn: VPN_OPTIONS
            },
            plus: {
                vpn: VPN_OPTIONS,
                address: ADDRESS_OPTIONS,
                space: SPACE_OPTIONS,
                domain: generateDomains(1, 11)
            },
            professional: {
                vpn: VPN_OPTIONS,
                member: MEMBER_OPTIONS,
                domain: generateDomains(2, 11)
            }
        };

        const get = (plan, addon) => angular.copy(options[plan][addon]);

        return { get };
    });
