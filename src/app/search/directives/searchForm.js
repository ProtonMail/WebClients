angular.module('proton.search')
    .directive('searchForm', ($rootScope, $state, $stateParams, searchModel, searchValue) => {

        const CLASS_OPEN = 'searchForm-container-adv';
        const dispatch = (type, data = {}) => $rootScope.$emit('advancedSearch', { type, data });

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
            templateUrl: 'templates/search/searchForm.tpl.html',
            link(scope, el) {
                const unsubscribe = [];
                let folders = searchModel.getFolderList();
                const addresses = searchModel.getAddresses();
                scope.model = {
                    folder: folders[0],
                    address: addresses[0],
                    attachments: '2'
                };
                scope.query = searchValue.generateSearchString(folders);

                const onOpen = () => {
                    // Auto get data from the query
                    const parameters = _.extend({}, searchValue.extractParameters(scope.query, folders), $stateParams);

                    scope.addresses = addresses;
                    scope.folders = folders;
                    scope.model.keyword = parameters.keyword;
                    scope.model.from = parameters.from;
                    scope.model.to = parameters.to;
                    scope.model.beginRaw = dateISO(parameters.begin);
                    scope.model.begin = dateTS(parameters.begin);
                    scope.model.endRaw = dateISO(parameters.end);
                    scope.model.end = dateTS(parameters.end);
                    scope.model.folder = _.findWhere(folders, { value: parameters.label }) || folders[0];
                };

                unsubscribe.push($rootScope.$on('updateUser', () => {
                    scope.addresses = searchModel.getAddresses();
                }));

                unsubscribe.push($rootScope.$on('$stateChangeSuccess', () => {
                    scope.query = searchValue.generateSearchString(folders);
                }));

                unsubscribe.push($rootScope.$on('advancedSearch', (e, { type, data }) => {
                    if (type === 'open') {
                        el[0].classList[data.visible ? 'add' : 'remove'](CLASS_OPEN);
                        scope.$applyAsync(() => {
                            onOpen();
                            scope.advancedSearch = data.visible;
                        });
                    }
                }));
                unsubscribe.push($rootScope.$on('labelsModel', (e, { type }) => {
                    if (type === 'cache.update' || type === 'cache.refresh') {
                        folders = searchModel.getFolderList();
                    }
                }));

                const go = (state, data) => {
                    $state.go(state, data);
                    dispatch('open', { visible: false });
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
                    unsubscribe.forEach((cb) => cb());
                    unsubscribe.length = 0;
                });
            }
        };
    });
