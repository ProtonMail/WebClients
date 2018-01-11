import _ from 'lodash';

/* @ngInject */
function overviewSection($rootScope, authentication, organizationModel, subscriptionModel) {
    return {
        replace: true,
        restrict: 'E',
        scope: {},
        templateUrl: require('../../../templates/dashboard/overviewSection.tpl.html'),
        link(scope, element) {
            const unsubscribe = [];
            const $buttons = element.find('.scroll');

            $buttons.on('click', onClick);

            function updateStorageBar() {
                const organization = organizationModel.get();
                const model = organization.PlanName === 'free' ? authentication.user : organization;
                const progress = model.UsedSpace / model.MaxSpace * 100;

                $rootScope.$emit('progressBar', { type: 'storageBar', data: { progress } });
            }

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
                $('.settings').animate(
                    {
                        scrollTop: $('#plans').offset().top
                    },
                    1000
                );
            }

            const refreshUser = () => {
                authentication.fetchUserInfo().then((data) => (scope.user = data));
            };

            unsubscribe.push(
                $rootScope.$on('updateUser', () => {
                    updateUser();
                    updateStorageBar();
                })
            );

            unsubscribe.push(
                $rootScope.$on('organizationChange', (e, organization) => {
                    updateOrganization(organization);
                    updateStorageBar();
                })
            );

            unsubscribe.push(
                $rootScope.$on('subscription', (e, { type, data = {} }) => {
                    type === 'update' && updateSubscription(data.subscription);
                })
            );

            unsubscribe.push(
                $rootScope.$on('payments', (e, { type }) => {
                    type === 'topUp.request.success' && refreshUser();
                })
            );

            updateUser();
            updateOrganization(organizationModel.get());
            updateSubscription(subscriptionModel.get());
            updateStorageBar();

            scope.$on('$destroy', () => {
                $buttons.off('click', onClick);
                _.each(unsubscribe, (cb) => cb());
                unsubscribe.length = 0;
            });
        }
    };
}
export default overviewSection;
