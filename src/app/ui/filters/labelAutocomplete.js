import { EMAIL_FORMATING } from '../../constants';

const { OPEN_TAG_AUTOCOMPLETE_RAW, CLOSE_TAG_AUTOCOMPLETE_RAW } = EMAIL_FORMATING;

/* @ngInject */
function labelAutocomplete() {

    return ({ Name = '', Address = '' } = {}) => {
        if (Name === Address) {
            return Address;
        }

        return `${Name} ${OPEN_TAG_AUTOCOMPLETE_RAW}${Address}${CLOSE_TAG_AUTOCOMPLETE_RAW}`;
    };
}
export default labelAutocomplete;
