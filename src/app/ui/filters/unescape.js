import _ from 'lodash';

/* @ngInject */
function unescape() {
    return (input) => _.unescape(input);
}
export default unescape;
