angular.module('proton.ui')
.filter('labelAutocomplete', (CONSTANTS) => {
    const { OPEN_TAG_AUTOCOMPLETE_RAW, CLOSE_TAG_AUTOCOMPLETE_RAW } = CONSTANTS.EMAIL_FORMATING;

    return ({ Name = '', Address = '' } = {}) => (Name === Address) ? Address : `${Name} ${OPEN_TAG_AUTOCOMPLETE_RAW}${Address}${CLOSE_TAG_AUTOCOMPLETE_RAW}`;
});
