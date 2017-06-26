angular.module('proton.dashboard')
    .directive('overviewSection', ($rootScope, authentication, organizationModel, subscriptionModel) => {
        return {
            replace: true,
            restrict: 'E',
            scope: {},
            templateUrl: 'templates/dashboard/overviewSection.tpl.html',
            link(scope, element) {
                const unsubscribe = [];
                const $buttons = element.find('.scroll');

                $buttons.on('click', onClick());

                unsubscribe.push($rootScope.$on('updateUser', () => {
                    updateUser();
                }));

                unsubscribe.push($rootScope.$on('organizationChange', (event, organization) => {
                    updateOrganization(organization);
                }));

                unsubscribe.push($rootScope.$on('subscription', (event, { type, data = {} }) => {
                    (type === 'update') && updateSubscription(data.subscription);
                }));

                function updateUser() {
                    scope.$applyAsync(() => {
                        scope.user = angular.copy(authentication.user);
                    });
                }

                function updateOrganization(organization) {
                    scope.$applyAsync(() => {
                        scope.organization = angular.copy(organization);
                    });
                }

                function updateSubscription(subscription) {
                    scope.$applyAsync(() => {
                        scope.subscription = angular.copy(subscription);
                    });
                }

                function onClick() {
                    $('.settings').animate({
                        scrollTop: $('#plans').offset().top
                    }, 1000);
                }

                updateUser();
                updateOrganization(organizationModel.get());
                updateSubscription(subscriptionModel.get());

                scope.$on('$destroy', () => {
                    $buttons.off('click', onClick());
                    _.each(unsubscribe, (cb) => cb());
                    unsubscribe.length = 0;
                });
            }
        };
    });
