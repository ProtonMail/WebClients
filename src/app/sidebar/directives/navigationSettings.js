import dedentTpl from '../../../helpers/dedent';

/* @ngInject */
function navigationSettings($rootScope, $state, sidebarSettingsModel) {
    const CLASS_ACTIVE = 'active';
    const template = (key, { label, icon = '', state }) => {
        const iconClassName = `sidebarApp-icon navigationSettings-icon fa ${icon}`.trim();
        const href = $state.href(state);
        return dedentTpl(`<a class="navigationSettings-link sidebarApp-link" href="${href}" data-state="${key}">
                    <i class="${iconClassName}"></i>
                    <span>${label}</span>
                </a>`);
    };

    return {
        replace: true,
        template: '<li class="navigationSettings-container"></li>',
        link(scope, el, { key }) {
            const STATES = sidebarSettingsModel.getStateConfig();
            const config = STATES[key];
            el[0].innerHTML = template(key, config);
            el[0].classList.add(`navigationSettings-is-${key}`);

            // Check if we open the current state, mark it as active
            $state.includes(config.state) && el[0].classList.add(CLASS_ACTIVE);

            // Check the current state to set the current one as active
            const unsubscribe = $rootScope.$on('$stateChangeSuccess', (e, state) => {
                if (state.name === config.state) {
                    return el[0].classList.add(CLASS_ACTIVE);
                }

                el[0].classList.remove(CLASS_ACTIVE);
            });

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default navigationSettings;
