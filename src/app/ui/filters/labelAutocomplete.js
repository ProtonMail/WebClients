angular.module('proton.ui')
.filter('labelAutocomplete', (CONSTANTS) => {
    const { OPEN_TAG_AUTOCOMPLETE, CLOSE_TAG_AUTOCOMPLETE } = CONSTANTS.EMAIL_FORMATING;

    return ({ Name = '', Address = '' } = {}) => (Name === Address) ? Address : `${Name} ${OPEN_TAG_AUTOCOMPLETE}${Address}${CLOSE_TAG_AUTOCOMPLETE}`;
});
