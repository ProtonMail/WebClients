angular.module('proton.dashboard')
    .directive('subscriptionSection', ($rootScope, subscriptionModel, gettextCatalog) => {
        const I18N = {
            addresses: gettextCatalog.getString('addresses', null),
            domain: gettextCatalog.getString('domain', null),
            domains: gettextCatalog.getString('domains', null),
            member: gettextCatalog.getString('member', null),
            members: gettextCatalog.getString('members', null),
            cycles: {
                1: gettextCatalog.getString('Monthly', null),
                12: gettextCatalog.getString('Annually', null)
            },
            methods: {
                card: gettextCatalog.getString('Credit card', null),
                paypal: 'Paypal'
            }
        };

        const formatSubscription = (sub) => {
            sub.cycle = I18N.cycles[sub.Cycle];
            return sub;
        };

        const getFirstMethodType = (methods = []) => ((methods.length) ? I18N.methods[methods[0].Type] : 'None');

        function formatTitle(plan = {}) {
            switch (plan.Name) {
                case '1gb':
                    plan.Title = `+ ${plan.time} GB`;
                    break;
                case '5address':
                    plan.Title = `+ ${plan.time * 5} ${I18N.addresses}`;
                    break;
                case '1domain':
                    plan.Title = `+ ${plan.time} ${(plan.time > 1) ? I18N.domains : I18N.domain}`;
                    break;
                case '1member':
                    plan.Title = `+ ${plan.time} ${(plan.time > 1) ? I18N.members : I18N.member}`;
                    break;
                default:
                    break;
            }
        }

        function extractAddons({ Plans = [] } = {}) {
            return _.chain(Plans)
                .where({ Type: 0 })
                .reduce((acc, plan) => {
                    if (acc[plan.Name]) {
                        acc[plan.Name].Amount += plan.Amount;
                        acc[plan.Name].time++;
                    } else {
                        acc[plan.Name] = plan;
                        acc[plan.Name].time = 1;
                    }

                    return acc;
                }, {})
                .each((plan) => formatTitle(plan))
                .value();
        }

        return {
            scope: { methods: '=' },
            restrict: 'E',
            replace: true,
            templateUrl: 'templates/dashboard/subscriptionSection.tpl.html',
            link(scope) {
                const subscription = subscriptionModel.get();
                const unsubscribe = $rootScope.$on('subscription', (event, { type, data = {} }) => {
                    if (type === 'update') {
                        scope.$applyAsync(() => {
                            scope.subscription = formatSubscription(data.subscription);
                            scope.addons = extractAddons(data.subscription);
                        });
                    }
                });

                scope.subscription = formatSubscription(subscription);
                scope.addons = extractAddons(subscription);
                scope.method = getFirstMethodType(scope.methods);

                scope.$on('$destroy', () => unsubscribe());
            }
        };
    });
