/* @ngInject */
function overviewSection(authentication, dispatchers, organizationModel, subscriptionModel) {
    return {
        replace: true,
        restrict: 'E',
        scope: {},
        templateUrl: require('../../../templates/dashboard/overviewSection.tpl.html'),
        link(scope, element) {
            const { dispatcher, on, unsubscribe } = dispatchers(['progressBar']);
            const $buttons = element.find('.scroll');

            $buttons.on('click', onClick);

            function updateStorageBar() {
                const organization = organizationModel.get();
                const model = organization.PlanName === 'free' ? authentication.user : organization;
                const progress = model.UsedSpace / model.MaxSpace * 100;

                dispatcher.progressBar('storageBar', { progress });
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

            on('updateUser', () => {
                updateUser();
                updateStorageBar();
            });

            on('organizationChange', (e, { data: organization }) => {
                updateOrganization(organization);
                updateStorageBar();
            });

            on('subscription', (e, { type, data = {} }) => {
                type === 'update' && updateSubscription(data.subscription);
            });

            on('payments', (e, { type }) => {
                type === 'topUp.request.success' && refreshUser();
            });

            updateUser();
            updateOrganization(organizationModel.get());
            updateSubscription(subscriptionModel.get());
            updateStorageBar();

            scope.$on('$destroy', () => {
                $buttons.off('click', onClick);
                unsubscribe();
            });
        }
    };
}
export default overviewSection;
