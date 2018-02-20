import _ from 'lodash';
import dedentTpl from '../../../helpers/dedent';

/* @ngInject */
function navigationItem($rootScope, $state, $stateParams, sidebarModel, eventManager, AppModel) {
    const CLASS_ACTIVE = 'active';
    const CLASS_SPIN = 'spinMe';
    const template = (key, { state, label, icon = '' }) => {
        const iconClassName = `sidebarApp-icon navigationItem-icon fa ${icon}`.trim();
        const opt = { sort: null, filter: null, page: null };
        const dropzone = key !== 'allmail' ? `data-pt-dropzone-item="${key}"` : '';
        return dedentTpl(`<a href="${$state.href(
            state,
            opt
        )}" title="${label}" data-label="${label}" data-state="${key}" class="navigationItem-item" ${dropzone}>
                <i class="${iconClassName}"></i>
                <span class="navigationItem-title">${label}</span>
                <div class="navigationItem-aside">
                    <em class="navigationItem-counter"></em>
                    <button class="fa fa-repeat refresh navigationItem-btn-refresh"></button>
                </div>
            </a>`);
    };

    const setSpinner = ($spin, lastTimeoutId) => {
        $spin.classList.add(CLASS_SPIN);
        clearTimeout(lastTimeoutId);
        return setTimeout(() => {
            /**
             * Send request to get the last event, empty the cache
             * for the current mailbox and then refresh the content
             * automatically
             */
            eventManager
                .call()
                .then(() => $spin.classList.remove(CLASS_SPIN))
                .catch((error) => {
                    console.error(error);
                    $spin.classList.remove(CLASS_SPIN);
                });
        }, 500);
    };

    return {
        replace: true,
        template: '<li class="navigationItem-container"></li>',
        link(scope, el, { key }) {
            let id;
            const STATES = sidebarModel.getStateConfig();
            const config = STATES[key];
            const unsubscribe = [];
            const render = () => (el[0].innerHTML = template(key, config));
            const updateCounter = () => {
                const $anchor = el[0].querySelector('.navigationItem-item');
                const $counter = $anchor.querySelector('.navigationItem-counter');
                const total = sidebarModel.unread(key);
                $anchor.title = `${$anchor.getAttribute('data-label')} ${total}`.trim();
                $counter.textContent = total;
            };
            const updateActive = () => {
                const { states = [], state = '' } = config;
                const addActive = () => el[0].classList.add(CLASS_ACTIVE);

                // Sent and Drafts have each 2 states
                if (states.length && _.find(states, (route) => $state.includes(route))) {
                    return addActive();
                }

                if ($state.includes(state)) {
                    return addActive();
                }

                el[0].classList.remove(CLASS_ACTIVE);
            };

            updateActive(); // Check if we open the current state, mark it as active
            render();
            updateCounter();

            // Update the counter when we load then
            unsubscribe.push(
                $rootScope.$on('app.cacheCounters', (e, { type }) => {
                    type === 'load' && updateCounter();
                })
            );

            // Update the counter when we update it (too many updates if we update them via app.cacheCounters)
            unsubscribe.push(
                $rootScope.$on('elements', (e, { type }) => {
                    type === 'refresh' && updateCounter();
                })
            );

            // Check the current state to set the current one as active
            unsubscribe.push(
                $rootScope.$on('$stateChangeSuccess', () => {
                    updateActive();
                })
            );

            const onClick = () => {
                const sameRoute = $state.$current.name === config.state && !$stateParams.filter;
                const firstPage = ~~$stateParams.page === 1 || angular.isUndefined($stateParams.page);

                AppModel.set('requestTimeout', false);

                if (sameRoute && firstPage) {
                    AppModel.set('showSidebar', false);
                    return (id = setSpinner(el[0].querySelector('.refresh'), id));
                }
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
                unsubscribe.forEach((cb) => cb());
                unsubscribe.length = 0;
            });
        }
    };
}
export default navigationItem;
