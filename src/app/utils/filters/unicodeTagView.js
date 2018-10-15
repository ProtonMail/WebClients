import { EMAIL_FORMATING } from '../../constants';

const {
    OPEN_TAG_AUTOCOMPLETE,
    CLOSE_TAG_AUTOCOMPLETE,
    OPEN_TAG_AUTOCOMPLETE_RAW,
    CLOSE_TAG_AUTOCOMPLETE_RAW
} = EMAIL_FORMATING;

export const MAP_TAGS = {
    [OPEN_TAG_AUTOCOMPLETE_RAW]: OPEN_TAG_AUTOCOMPLETE,
    [CLOSE_TAG_AUTOCOMPLETE_RAW]: CLOSE_TAG_AUTOCOMPLETE,
    [OPEN_TAG_AUTOCOMPLETE]: OPEN_TAG_AUTOCOMPLETE_RAW,
    [CLOSE_TAG_AUTOCOMPLETE]: CLOSE_TAG_AUTOCOMPLETE_RAW
};

/* @ngInject */
function unicodeTagView() {
    const matchTagOpenClose = () => new RegExp(`${OPEN_TAG_AUTOCOMPLETE_RAW}|${CLOSE_TAG_AUTOCOMPLETE_RAW}`, 'ig');
    const matchTagUnicodeOpenClose = () => new RegExp(`${OPEN_TAG_AUTOCOMPLETE}|${CLOSE_TAG_AUTOCOMPLETE}`, 'ig');

    /**
     * Replace <> (for a tag) via unicode
     * @param  {String} input
     * @return {String}
     */
    return (input = '', mode) => {
        if (mode === 'reverse') {
            return input.replace(matchTagUnicodeOpenClose(), (match) => MAP_TAGS[match] || '');
        }

        return input.replace(matchTagOpenClose(), (match) => MAP_TAGS[match] || '');
    };
}
export default unicodeTagView;
