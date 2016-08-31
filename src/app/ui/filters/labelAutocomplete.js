angular.module('proton.ui')
.filter('labelAutocomplete', () => {
    return ({ Name = '', Address = '' } = {}) => Name || Address;
});
