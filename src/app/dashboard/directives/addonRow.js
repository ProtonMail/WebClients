import _ from 'lodash';

/* @ngInject */
function addonRow(
    $filter,
    $rootScope,
    CONSTANTS,
    customProPlanModal,
    dashboardConfiguration,
    dashboardModel,
    dashboardOptions,
    gettextCatalog,
    subscriptionModel,
    customProPlanModel
) {
    customProPlanModel.init();
    const { MEMBER, ADDRESS, DOMAIN, SPACE } = CONSTANTS.PLANS.ADDON;
    const MAP_ADDONS = { member: MEMBER, address: ADDRESS, domain: DOMAIN, space: SPACE };
    const LIMIT_REACHED_CLASS = 'addonRow-limit-reached';
    const SELECT_CLASS = 'addonRow-select';
    const PLACEHOLDER_CLASS = 'addonRow-placeholder';
    const EDIT_CLASS = 'addonRow-edit';

    const filter = (amount) => $filter('currency')(amount / 100 / dashboardConfiguration.cycle(), dashboardConfiguration.currency());
    const getPrice = ({ addon, value }) => {
        if (!value || value === 'none') {
            return '';
        }

        const amounts = dashboardModel.amounts();

        return `+ ${filter(amounts[MAP_ADDONS[addon]] * value)}/mo`;
    };
    const openModal = () => {
        customProPlanModal.activate({
            params: {
                close() {
                    customProPlanModal.deactivate();
                }
            }
        });
    };
    return {
        restrict: 'E',
        replace: true,
        scope: {},
        templateUrl: require('../../../templates/dashboard/addonRow.tpl.html'),
        compile(element, { addon, plan }) {
            const initValue = subscriptionModel.count(addon);
            const dispatch = (value) => $rootScope.$emit('dashboard', { type: 'change.addon', data: { addon, plan, value } });
            const $select = element.find(`.${SELECT_CLASS}`);
            const $placeholder = element.find(`.${PLACEHOLDER_CLASS}`);
            const $edit = element.find(`.${EDIT_CLASS}`);
            const set = (value) => {
                const option = element.find(`.${SELECT_CLASS} option[value='${value}']`);

                if (option.length) {
                    element[0].classList.remove(LIMIT_REACHED_CLASS);
                    return $select.val(`${value}`);
                }

                element[0].classList.add(LIMIT_REACHED_CLASS);
                $placeholder[0].setAttribute('data-value', value);
                $placeholder[0].textContent = `${dashboardOptions.translate(addon, value + 1)} ${getPrice({ addon, value })}`;
            };

            function buildOptions() {
                const options = _.reduce(
                    dashboardOptions.get(plan, addon),
                    (acc, { label, value }) => {
                        if (value === 'openModal') {
                            return acc + `<option value="${value}">${label}</option>`;
                        }

                        return acc + `<option value="${value}">${label} ${getPrice({ addon, value })}</option>`;
                    },
                    ''
                );

                $select.html(options);
            }

            buildOptions();

            return (scope) => {
                const onChange = () => {
                    const selectValue = $select.val();

                    if (addon === 'member' && plan === 'professional' && selectValue === 'openModal') {
                        dispatch(99);
                        return openModal();
                    }

                    dispatch(+selectValue);
                };
                const unsubscribe = $rootScope.$on('dashboard', (event, { type, data = {} }) => {
                    if (type === 'addon.updated' && data.addon === addon && data.plan === plan) {
                        buildOptions();
                        set(data.value);
                    }

                    if (type === 'currency.updated' || type === 'cycle.updated') {
                        const value = element[0].classList.contains(LIMIT_REACHED_CLASS) ? ~~$placeholder[0].getAttribute('data-value') : $select.val();

                        buildOptions();
                        set(value);
                    }
                });

                $select.on('change', onChange);
                $edit.on('click', openModal);
                set(initValue);
                dispatch(initValue);

                scope.$on('$destroy', () => {
                    unsubscribe();
                    $edit.off('click', openModal);
                    $select.off('change', onChange);
                });
            };
        }
    };
}
export default addonRow;
