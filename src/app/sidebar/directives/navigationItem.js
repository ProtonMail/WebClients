import _ from 'lodash';
import dedentTpl from '../../../helpers/dedent';

/* @ngInject */
function navigationItem(
    $state,
    $stateParams,
    dispatchers,
    sidebarModel,
    eventManager,
    AppModel,
    storageWarning,
    $compile
) {
    const ATTR_ACTIVE = 'aria-current';
    const CLASS_SPIN = 'spinMe';
    const template = (key, { state, label, icon = '' }) => {
        const opt = { sort: null, filter: null, page: null };
        const dropzone = key !== 'allmail' ? `data-pt-dropzone-item="${key}"` : '';
        return dedentTpl(`<a href="${$state.href(
            state,
            opt
        )}" title="${label}" data-label="${label}" data-state="${key}" class="navigation__link w100" ${dropzone}>
                <span class="flex">
                    <icon data-name="${icon}" data-size="16" class="mr0-5 flex-item-centered-vert fill-white"></icon>
                    <span class="navigationItem-title">${label}</span>
                    <span class="navigationItem-aside">
                        <em class="navigationItem-counter"></em>
                        <button class="fa fa-repeat refresh navigationItem-btn-refresh"></button>
                    </span>
                </span>
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
            const { on, unsubscribe } = dispatchers();

            let id;
            const STATES = sidebarModel.getStateConfig();
            const config = STATES[key];

            const render = () => {
                el.empty().append($compile(template(key, config))(scope));
            };
            const updateCounter = () => {
                const $anchor = el[0].querySelector('.navigation__link');
                const $counter = $anchor.querySelector('.navigationItem-counter');
                const total = sidebarModel.unread(key);
                $anchor.title = `${$anchor.getAttribute('data-label')} ${total}`.trim();
                $counter.textContent = total;
            };
            const updateActive = () => {
                const { states = [], state = '' } = config;
                const addActive = () => el[0].firstElementChild.setAttribute(ATTR_ACTIVE, 'page');

                // Sent and Drafts have each 2 states
                if (states.length && _.some(states, (route) => $state.includes(route))) {
                    return addActive();
                }

                if ($state.includes(state)) {
                    return addActive();
                }

                el[0].firstElementChild.removeAttribute(ATTR_ACTIVE);
            };

            render();
            updateCounter();
            updateActive(); // Check if we open the current state, mark it as active

            // Update the counter when we load then
            on('app.cacheCounters', (e, { type }) => {
                type === 'load' && updateCounter();
            });

            // Update the counter when we update it (too many updates if we update them via app.cacheCounters)
            on('elements', (e, { type }) => {
                type === 'refresh' && updateCounter();
            });

            // Check the current state to set the current one as active
            on('$stateChangeSuccess', () => {
                updateActive();
            });

            const onClick = () => {
                const sameRoute = $state.$current.name === config.state && !$stateParams.filter;
                const firstPage = ~~$stateParams.page === 1 || angular.isUndefined($stateParams.page);

                AppModel.set('requestTimeout', false);

                if (sameRoute && firstPage) {
                    if (storageWarning.isLimitReached()) {
                        storageWarning.showModal();
                    }

                    AppModel.set('showSidebar', false);
                    return (id = setSpinner(el[0].querySelector('.refresh'), id));
                }
            };

            el.on('click', onClick);

            scope.$on('$destroy', () => {
                el.off('click', onClick);
                unsubscribe();
            });
        }
    };
}
export default navigationItem;
