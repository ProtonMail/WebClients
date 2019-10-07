import _ from 'lodash';

/* @ngInject */
function searchForm(
    dispatchers,
    $state,
    $stateParams,
    authentication,
    searchModel,
    searchValue,
    dateUtils,
    mailSettingsModel
) {
    const CLASS_OPEN = 'searchForm-container-adv';

    /**
     * Format the date as a string because the lib is not able to parse a timestamp.
     * (╯ὸ︹ό）╯︵ ┻━┻
     * @param  {String} date
     * @return {String}      As ISO
     */
    const dateISO = (date) => (date ? new Date(date * 1000).toISOString() : undefined);

    /**
     * Convert a unix timestamp to a JS timestamp
     * @param  {String} date Unix timestamp
     * @return {Date}
     */
    const dateTS = (date) => (date ? new Date(date * 1000) : undefined);
    const getState = (query = '') => `secured.${query ? 'search' : 'inbox'}`;

    return {
        scope: {},
        replace: true,
        templateUrl: require('../../../templates/search/searchForm.tpl.html'),
        compile(elem) {
            const searchDate = elem.find('.search-date');
            searchDate.attr('placeholder', dateUtils.I18N.localizedDatePlaceholder);

            return (scope, el) => {
                const { on, unsubscribe, dispatcher } = dispatchers(['dropdownApp']);

                const { AutoWildcardSearch } = mailSettingsModel.get();
                let dropdownID;
                const getDropdownID = () =>
                    dropdownID || el[0].querySelector('[data-dropdown-id]').getAttribute('data-dropdown-id');

                let folders = searchModel.getFolderList();
                const addresses = searchModel.getAddresses();
                const $input = el[0].querySelector('.search-form-fieldset-input');

                scope.model = {
                    wildcard: Boolean(AutoWildcardSearch),
                    folder: folders[0],
                    address: addresses[0],
                    attachments: '2'
                };
                scope.query = searchValue.generateSearchString(folders);

                const onOpen = () => {
                    // Auto get data from the query
                    const parameters = {
                        ...searchValue.extractParameters(scope.query, folders),
                        ...$stateParams
                    };

                    scope.addresses = addresses;
                    scope.folders = folders;
                    scope.model.keyword = parameters.keyword;
                    scope.model.from = parameters.from;
                    scope.model.to = parameters.to;
                    scope.model.beginRaw = dateISO(parameters.begin);
                    scope.model.begin = dateTS(parameters.begin);
                    scope.model.endRaw = dateISO(parameters.end);
                    scope.model.end = dateTS(parameters.end);
                    scope.model.folder = _.find(folders, { value: parameters.label }) || folders[0];
                };

                on('addresses.updated', () => {
                    scope.addresses = searchModel.getAddresses();
                });

                on('hotkeys', (e, { type }) => {
                    type === 'slash' && $input.focus();
                });

                on('$stateChangeSuccess', () => {
                    scope.query = searchValue.generateSearchString(folders);
                });

                on('dropdownApp', (e, { type, data }) => {
                    if (!dropdownID) {
                        dropdownID = getDropdownID();
                    }

                    if (data.id !== dropdownID) {
                        return;
                    }

                    if (type === 'state') {
                        const action = data.isOpened ? 'add' : 'remove';
                        el[0].classList[action](CLASS_OPEN);
                        data.isOpened && scope.$applyAsync(onOpen);
                    }
                });

                on('labelsModel', (e, { type }) => {
                    if (type === 'cache.update' || type === 'cache.refresh') {
                        folders = searchModel.getFolderList();
                    }
                });

                on('search', (e, { type }) => {
                    if (type === 'reset.search') {
                        scope.$applyAsync(() => {
                            scope.query = '';
                            $input.focus();
                        });
                    }
                });

                const go = (state, data) => {
                    $state.go(state, data);
                    dispatcher.dropdownApp('action', {
                        type: 'close',
                        id: dropdownID
                    });
                };

                const onSubmit = () => {
                    const query = scope.query;
                    const isOpen = el[0].classList.contains(CLASS_OPEN);
                    const data = searchValue.extractParameters(query, folders);
                    const model = searchModel.build(scope.model);
                    const state = getState(query || model.keyword || isOpen);

                    if (!isOpen) {
                        return go(state, searchModel.build(data));
                    }
                    return go(state, model);
                };

                el.on('submit', onSubmit);

                scope.$on('$destroy', () => {
                    el.off('submit', onSubmit);
                    unsubscribe();
                });
            };
        }
    };
}
export default searchForm;
