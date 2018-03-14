import { EMAIL_FORMATING } from '../../constants';

const { OPEN_TAG_AUTOCOMPLETE, CLOSE_TAG_AUTOCOMPLETE } = EMAIL_FORMATING;

/* @ngInject */
function chevrons() {
    return (input) => input.replace(CLOSE_TAG_AUTOCOMPLETE, '>').replace(OPEN_TAG_AUTOCOMPLETE, '<');
}
export default chevrons;
