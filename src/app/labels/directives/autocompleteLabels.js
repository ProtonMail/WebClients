import { flow, filter, take, map } from 'lodash/fp';

import { AWESOMEPLETE_MAX_ITEMS } from '../../constants';
import { htmlEntities } from '../../../helpers/string';

/* @ngInject */
function autocompleteLabels(autocompleteBuilder, labelsModel, dispatchers) {
    const filterLabels = ({ labels = [], map: mapCache = {} }, val = '') => {
        const input = val.trim().toLowerCase();

        const list = flow(
            filter(({ Name, ID }) => {
                return !mapCache[ID] && Name.toLowerCase().includes(input);
            }),
            map((label) => ({ label: htmlEntities(label.Name), value: label })),
            take(AWESOMEPLETE_MAX_ITEMS)
        )(labels);

        return {
            list,
            hasAutocompletion: !!list.length
        };
    };

    function link(scope, el, { awesomplete }) {
        const CACHE = {
            labels: labelsModel.get('labels'),
            map: Object.create(null)
        };
        const { dispatcher, on, unsubscribe } = dispatchers(['autocompleteLabels']);

        const loadAutoComplete = (value = '') => {
            const { list, hasAutocompletion } = filterLabels(CACHE, value);
            hasAutocompletion && (awesomplete.list = list);
        };

        const onInput = ({ target }) => {
            loadAutoComplete(target.value);
        };

        const onClick = ({ target }) => {
            target.nodeName === 'INPUT' && loadAutoComplete();
        };

        awesomplete.minChars = 0;
        awesomplete.replace = function replace(opt) {
            CACHE.map[opt.value.ID] = true;
            dispatcher.autocompleteLabels('select', opt);
            this.input.value = '';
        };

        el.on('click', onClick);
        el.on('input', onInput);

        on('autocompleteLabels', (e, { type, data = {} }) => {
            if (type === 'remove') {
                const { ID } = data.label || {};
                delete CACHE.map[ID];
            }
        });

        scope.$on('$destroy', () => {
            el.off('click', onClick);
            el.off('input', onInput);
            unsubscribe();
        });
    }

    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/labels/autocompleteLabels.tpl.html'),
        compile: autocompleteBuilder({ link })
    };
}
export default autocompleteLabels;
