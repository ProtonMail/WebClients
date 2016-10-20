angular.module('proton.message')
    .filter('recipients', ($filter, gettextCatalog) => {

        const filter = $filter('contact');
        const formatAddresses = (key) => (contact, index) => {
            const name = filter(contact, 'Name');
            return (index === 0) ? `${key}: ${name}` : name;
        };

        return ({ ToList = [], CCList = [], BCCList = [] } = {}) => {

            return []
                .concat(ToList.map(formatAddresses(gettextCatalog.getString('To', null, 'Title'))))
                .concat(CCList.map(formatAddresses(gettextCatalog.getString('CC', null, 'Title'))))
                .concat(BCCList.map(formatAddresses(gettextCatalog.getString('BCC', null, 'Title'))))
                .join(', ');
        };
    });
