angular.module('proton.utils')
    .filter('unicodeTagView', (CONSTANTS) => {

        const {
            OPEN_TAG_AUTOCOMPLETE,
            CLOSE_TAG_AUTOCOMPLETE,
            OPEN_TAG_AUTOCOMPLETE_RAW,
            CLOSE_TAG_AUTOCOMPLETE_RAW
        } = CONSTANTS.EMAIL_FORMATING;

        const MAP_TAGS = {
            [OPEN_TAG_AUTOCOMPLETE_RAW]: OPEN_TAG_AUTOCOMPLETE,
            [CLOSE_TAG_AUTOCOMPLETE_RAW]: CLOSE_TAG_AUTOCOMPLETE
        };

        const matchTagOpenClose = () => new RegExp(`${OPEN_TAG_AUTOCOMPLETE_RAW}|${CLOSE_TAG_AUTOCOMPLETE_RAW}`, 'ig');

        /**
         * Replace <> (for a tag) via unicode
         * @param  {String} input
         * @return {String}
         */
        return (input = '') => {
            return input.replace(matchTagOpenClose(), (match) => MAP_TAGS[match] || '');
        };

    });
