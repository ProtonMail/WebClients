import _ from 'lodash';

/* @ngInject */
function searchForm(
    dispatchers,
    $state,
    hotkeys,
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
                    query: searchValue.generateSearchString(folders),
                    wildcard: AutoWildcardSearch === 0,
                    folder: folders[0],
                    address: addresses[0],
                    attachments: '2'
                };

                const onOpen = () => {
                    // Auto get data from the query
                    const parameters = {
                        ...searchValue.extractParameters(scope.model.query, folders),
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
                    scope.model.query = searchValue.generateSearchString(folders);
                });

                on('dropdownApp', (e, { type, data }) => {
                    if (!dropdownID) {
                        dropdownID = getDropdownID();
                    }

                    if (data.id !== dropdownID) {
                        return;
                    }

                    if (type === 'state') {
                        if (data.isOpened) {
                            el[0].classList.add(CLASS_OPEN);
                            hotkeys.pause();
                        } else {
                            // defer so on Submit we're able to deal with the advanced search
                            _.defer(() => {
                                el[0].classList.remove(CLASS_OPEN);
                            }, 300);

                            if (document.activeElement !== $input) {
                                hotkeys.unpause();
                            }
                        }

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
                            scope.model.query = '';
                            $input.focus();
                        });
                    }
                });

                const go = async (state, data) => {
                    await $state.go(state, data);
                    dispatcher.dropdownApp('action', {
                        type: 'close',
                        id: dropdownID
                    });
                    hotkeys.pause();
                };

                const onSubmit = () => {
                    const isOpen = el[0].classList.contains(CLASS_OPEN);
                    const query = isOpen ? scope.model.keyword : scope.model.query;
                    const data = searchValue.extractParameters(query, folders);
                    const model = searchModel.build(scope.model);
                    const state = getState(query || isOpen);
                    hotkeys.unpause();

                    if (!isOpen) {
                        return go(
                            state,
                            searchModel.build({
                                ...data,
                                keyword: data.keyword || data.query
                            })
                        );
                    }
                    return go(state, model);
                };

                const onBlur = () => {
                    const isOpen = el[0].classList.contains(CLASS_OPEN);
                    !isOpen && hotkeys.unpause();
                };

                $input.addEventListener('focus', hotkeys.pause);
                $input.addEventListener('blur', onBlur);

                el.on('submit', onSubmit);

                scope.$on('$destroy', () => {
                    el.off('submit', onSubmit);
                    unsubscribe();
                    $input.removeEventListener('focus', hotkeys.pause);
                    $input.removeEventListener('blur', onBlur);
                });
            };
        }
    };
}
export default searchForm;
