import { currentSorting } from '../../../helpers/urlHelpers';

/* @ngInject */
function contactArrowsSort($stateParams) {
    return {
        replace: true,
        templateUrl: require('../../../templates/contact/contactArrowsSort.tpl.html'),
        link(scope, element) {
            const highlightSortedArrow = () => {
                const { sort, order } = currentSorting($stateParams);

                if (!sort) {
                    return;
                }

                if (element.attr('data-sort') === sort) {
                    element.attr('order', order);
                }
            };

            highlightSortedArrow();
        }
    };
}

export default contactArrowsSort;
