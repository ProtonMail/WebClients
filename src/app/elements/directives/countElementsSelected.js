import { ucFirst } from '../../../helpers/string';

/* @ngInject */
function countElementsSelected(dispatchers, tools, $stateParams, cacheCounters, labelsModel, gettextCatalog) {
    const CLEANER = document.createElement('div');
    /**
     * Remove HTML inside a string, prevent XSS
     * @param  {String} s
     * @return {String}
     */
    const stripHTML = (s) => {
        CLEANER.textContent = s || '';
        return CLEANER.innerHTML;
    };

    const toI18n = (n) => {
        const totalEmail = gettextCatalog.getPlural(
            n,
            '{{$count}} email tagged',
            '{{$count}} emails tagged',
            {},
            'Info number email selected'
        );
        const countEmailSelected = `<span class="color-pm-blue">${totalEmail}</span>`;

        return gettextCatalog.getString(
            'You have {{::countEmailSelected}} with this label.',
            {
                countEmailSelected
            },
            'Info'
        );
    };

    return {
        replace: true,
        templateUrl: require('../../../templates/elements/countElementsSelected.tpl.html'),
        link(scope, element) {
            const { dispatcher } = dispatchers(['selectElements']);
            const $btn = element.find('.countElementsSelected-btn-unselect');
            const onClick = () => dispatcher.selectElements('all', { isChecked: false });

            if ($stateParams.label) {
                const id = $stateParams.label;
                const typeOfList = tools.getTypeList();
                const { Name, Exclusive } = labelsModel.read(id);
                const total = cacheCounters.totalMessage(id);

                scope.selectedLabelTotal = toI18n(total);
                scope.selectedLabelTotalRaw = total;
                scope.selectedLabelType = Exclusive && 'folder';
                scope.selectedLabelName = stripHTML(Name);
            }

            $btn.on('click', onClick);

            scope.$on('$destroy', () => {
                $btn.off('click', onClick);
            });
        }
    };
}
export default countElementsSelected;
