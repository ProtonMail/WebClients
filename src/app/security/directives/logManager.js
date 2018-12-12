import _ from 'lodash';

/* @ngInject */
function logManager(userSettingsModel, logsModel, dispatchers, $filter) {
    const limitTo = $filter('limitTo');

    function prepareModel(data = { logs: [], loaded: true, total: 0 }, origin = {}) {
        const { LogAuth } = userSettingsModel.get();
        return {
            ...data,
            perPage: 20,
            currentPage: 1,
            doLogging: LogAuth,
            ...origin
        };
    }

    async function load() {
        const data = await logsModel.load();
        return {
            total: data.length,
            logs: _.sortBy(data, 'Time').reverse(),
            loaded: true
        };
    }

    const paginate = ({ logs, perPage, currentPage }, init) => {
        const pos = init ? 0 : (currentPage - 1) * perPage;
        return limitTo(logs, perPage, pos);
    };

    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/security/logManager.tpl.html'),
        async link(scope, el) {
            const { dispatcher } = dispatchers(['paginatorScope']);

            const model = {};

            const render = (data = prepareModel(), rerender) => {
                const origin = !rerender ? {} : _.pick(model, ['list', 'logs', 'loaded', 'currentPage']);
                Object.assign(model, prepareModel(data, origin));

                scope.$applyAsync(() => {
                    scope.model = model;
                    scope.model.list = paginate(model, true);
                });
            };

            render(await load());

            /**
             * Set the new logging setting then we refresh the view, we don't want a full reload
             * as we need to preserve the user's config:
             *     - current page
             *     - current logs the user was watching
             * @param  {String} value  Input value: basic/advanced/disable
             * @return {Promise}
             */
            const setLogging = (value) => async () => {
                await logsModel.setLogging(value);
                render(
                    {
                        currentPage: model.currentPage
                    },
                    true
                );
            };

            const ACTIONS = {
                download: logsModel.download,
                disable: setLogging('disable'),
                basic: setLogging('basic'),
                advanced: setLogging('advanced'),
                async reload() {
                    render(await load());
                },
                async clear() {
                    const mode = await logsModel.clear();

                    // Refresh only post modification
                    if (mode === 'confirm') {
                        render();
                    }
                }
            };

            // It comes from a ng-change, no need to $applyAsync to update the view
            const changePage = (page) => {
                model.currentPage = page;
                dispatcher.paginatorScope('logs', { page });
                scope.model.list = paginate(model);
            };

            scope.changePage = changePage;

            const onClick = ({ target }) => {
                const action = target.getAttribute('data-action');
                ACTIONS[action] && ACTIONS[action](model);
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
            });
        }
    };
}
export default logManager;
