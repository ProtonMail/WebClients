/* @ngInject */
function countElementsSelected(
    dispatchers,
    tools,
    $stateParams,
    cacheCounters,
    labelsModel,
    gettextCatalog,
    sidebarModel
) {
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
        stored(total) {
            return gettextCatalog.getPlural(
                total,
                '{{$count}} email stored',
                '{{$count}} emails stored',
                {},
                'Info number email stored inside a folder'
            );
        },
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
            const count = `<b>${totalEmail}</b>`;

            return gettextCatalog.getString(
                'You selected {{count}} from this folder.',
                {
                    count
                },
                'Info'
            );
        },
        totalBox(state) {
            const total = sidebarModel.getRawTotal(state);
            const totalEmail = this.stored(total);
            const count = `<b>${totalEmail}</b>`;

            return gettextCatalog.getString(
                'You have {{count}} in this folder',
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
            const state = window.location.pathname.replace('/', '');
            const { dispatcher } = dispatchers(['selectElements']);
            const STATES = sidebarModel.getStateConfig();

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
            } else {
                const { label = '' } = STATES[state] || {};
                label && (scope.selectedLabelName = stripHTML(label));
            }

            scope.selectedLabelTotalTxt = (n) => I18N.elements(n);
            scope.getTotalBoxTxt = () => I18N.totalBox(state);

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default countElementsSelected;
