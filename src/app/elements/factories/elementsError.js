import _ from 'lodash';

/* @ngInject */
function elementsError(dispatchers) {
    const errors = [];
    const { on } = dispatchers();

    function last() {
        if (errors.length) {
            return _.last(errors);
        }
        return {};
    }

    on('elements', (event, { type, data = {} }) => {
        if (type === 'error') {
            errors.push(data);
        }
    });

    on('$stateChangeSuccess', () => {
        errors.length = 0;
    });

    return { init: angular.noop, last };
}
export default elementsError;
