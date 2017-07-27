angular.module('proton.dashboard')
    .directive('memberSelector', ($filter, $rootScope, dashboardModel, gettextCatalog, subscriptionModel) => {
        const MAX_MEMBER = 50;
        const FORM_NAME = 'memberSelector-form';
        const filter = (amount) => $filter('currency')(amount / 100 / dashboardModel.cycle(), dashboardModel.currency());

        return {
            restrict: 'E',
            replace: true,
            scope: {},
            template: `
                <form class="memberSelector-container" name="${FORM_NAME}" novalidate>
                    <custom-input-number
                        data-custom-ng-model="value"
                        data-custom-required=""
                        data-form="${FORM_NAME}"
                        data-custom-name="member"
                        data-custom-ng-change="onChange()"
                        data-custom-min="{{ min }}"
                        data-custom-max="${MAX_MEMBER}"
                    ></custom-input-number>
                    <span class="memberSelector-unit">{{ unit }}</span>
                    <strong class="memberSelector-price">{{ price }}</strong>
                </form>
            `,
            link(scope, element, { plan }) {
                const updatePrice = () => {
                    const amount = dashboardModel.amount({ plan, addon: 'member' });

                    scope.price = amount > 0 ? `+ ${filter(amount)}` : '';
                };
                const updateUnit = () => scope.unit = gettextCatalog.getPlural(scope.value, 'User', 'Users', {});
                const cache = dashboardModel.get(dashboardModel.cycle());
                const included = cache.plan[plan].MaxMembers;
                const unsubscribe = $rootScope.$on('dashboard', (event, { type, data = {} }) => {
                    if (type === 'addon.updated' && data.addon === 'member') {
                        scope.$applyAsync(() => {
                            scope.value = data.value + included;
                            updateUnit();
                            updatePrice();
                        });
                    }
                });

                scope.min = included;
                scope.value = included + subscriptionModel.count('member');
                scope.onChange = () => $rootScope.$emit('dashboard', { type: 'change.addon', data: { plan, addon: 'member', value: scope.value - included } });
                scope.onChange();

                scope.$on('$destroy', () => unsubscribe());
            }
        };
    });
