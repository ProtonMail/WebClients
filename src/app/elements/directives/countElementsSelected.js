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

    function getCounter(n) {
        const totalEmail = gettextCatalog.getPlural(
            n,
            '{{$count}} email tagged',
            '{{$count}} emails tagged',
            {},
            'Info number email selected'
        );
        return `<span class="color-pm-blue">${totalEmail}</span>`;
    }

    const I18N = {
        folder(n) {
            return gettextCatalog.getString(
                'You have {{::countEmailSelected}} with this folder.',
                {
                    countEmailSelected: getCounter(n)
                },
                'Info'
            );
        },
        label(n) {
            return gettextCatalog.getString(
                'You have {{::countEmailSelected}} with this label.',
                {
                    countEmailSelected: getCounter(n)
                },
                'Info'
            );
        },
        conversation(n) {
            return gettextCatalog.getPlural(n, '{{$count}} conversation', '{{$count}} conversations', {}, 'Info');
        },
        message(n) {
            return gettextCatalog.getPlural(n, '{{$count}} message', '{{$count}} messages', {}, 'Info');
        },
        elements(n) {
            const type = tools.getTypeList();
            const totalEmail = this[type](n);
            const count = `<span class="color-pm-blue bold">${totalEmail}</span>`;

            return gettextCatalog.getString(
                'You selected {{count}} from this folder.',
                {
                    count
                },
                'Info'
            );
        }
    };

    return {
        replace: true,
        templateUrl: require('../../../templates/elements/countElementsSelected.tpl.html'),
        link(scope, el) {
            const { dispatcher } = dispatchers(['selectElements']);
            const onClick = ({ target }) => {
                if (target.getAttribute('data-click-action') === 'unselect') {
                    dispatcher.selectElements('all', { isChecked: false });
                }
            };

            if ($stateParams.label) {
                const id = $stateParams.label;
                const { Name, Exclusive } = labelsModel.read(id);
                const total = cacheCounters.totalMessage(id);

                scope.selectedLabelTotal = I18N[Exclusive ? 'folder' : 'label'](total);
                scope.selectedLabelTotalRaw = total;
                scope.selectedLabelType = Exclusive && 'folder';
                scope.selectedLabelName = stripHTML(Name);
            }

            scope.selectedLabelTotalTxt = (n) => I18N.elements(n);

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default countElementsSelected;
