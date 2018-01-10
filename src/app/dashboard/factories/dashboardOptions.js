import _ from 'lodash';

/* @ngInject */
function dashboardOptions(gettextCatalog, CONSTANTS) {
    const { MAX_MEMBER } = CONSTANTS;
    const TRANSLATE = {
        address(value) {
            return gettextCatalog.getString('{{value}} Addresses', { value }, 'dashboard options select');
        },
        space(value) {
            return gettextCatalog.getPlural(value, '1 GB Storage', '{{$count}} GB Storage', {}, 'dashboard options select');
        },
        member(value) {
            return gettextCatalog.getPlural(value, '1 User', '{{$count}} Users', {}, 'dashboard options select');
        },
        domain(value) {
            return gettextCatalog.getPlural(value, '1 Custom Domain', '{{$count}} Custom Domains', {}, 'dashboard options select');
        }
    };

    const ADDRESS_OPTIONS = _.range(5, 51, 5).map((value, index) => ({
        label: TRANSLATE.address(value),
        value: index
    }));

    const SPACE_OPTIONS = _.range(5, 21).map((value, index) => ({
        label: TRANSLATE.space(value),
        value: index
    }));

    const MEMBER_OPTIONS = _.range(1, MAX_MEMBER + 1).map((value, index) => ({
        label: TRANSLATE.member(value),
        value: index
    }));

    MEMBER_OPTIONS.push({ label: '> 100', value: 'openModal' });

    const generateDomains = (start, end) =>
        _.range(start, end).map((value, index) => ({
            label: TRANSLATE.domain(value),
            value: index
        }));

    const options = {
        plus: {
            address: ADDRESS_OPTIONS,
            space: SPACE_OPTIONS,
            domain: generateDomains(1, 11)
        },
        professional: {
            member: MEMBER_OPTIONS,
            domain: generateDomains(2, 51)
        }
    };

    const get = (plan, addon) => angular.copy(options[plan][addon]);
    const translate = (type, value) => TRANSLATE[type](value);

    return { get, translate };
}
export default dashboardOptions;
