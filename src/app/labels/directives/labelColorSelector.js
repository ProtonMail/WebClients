import _ from 'lodash';
import { LABEL_COLORS } from '../../constants';

/* @ngInject */
function labelColorSelector() {
    return {
        scope: {
            color: '='
        },
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/labels/labelColorSelector.tpl.html'),
        link(scope, el) {
            const index = _.random(0, LABEL_COLORS.length - 1);
            scope.color = scope.color || LABEL_COLORS[index];
            scope.colors = LABEL_COLORS;
            const onClick = ({ target }) => {
                if (target.nodeName === 'INPUT') {
                    scope.$applyAsync(() => (scope.color = target.value));
                }
            };
            el.on('click', onClick);

            scope.$applyAsync(() => {
                el[0].querySelector(`[value="${scope.color}"]`).checked = true;
            });
            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default labelColorSelector;
