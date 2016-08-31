angular.module('proton.ui')
.filter('chevrons', (CONSTANTS) => {

    const { OPEN_TAG_AUTOCOMPLETE, CLOSE_TAG_AUTOCOMPLETE } = CONSTANTS.EMAIL_FORMATING;

    return (input) => {
        return input.replace(CLOSE_TAG_AUTOCOMPLETE, '>').replace(OPEN_TAG_AUTOCOMPLETE, '<');
    };
});
