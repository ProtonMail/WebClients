angular.module('proton.contact', ['vs-repeat'])
    .run((contactEditor, contactMerger) => {
        contactEditor.init();
        contactMerger.init();
    })
    .config(($stateProvider) => {
        $stateProvider
            .state('secured.contacts', {
                url: '/contacts?sort&page&keyword',
                params: {
                    page: { value: null, squash: true },
                    keyword: { value: null, squash: true },
                    sort: { value: null, squash: true }
                },
                resolve: {
                    delinquent(user, isDelinquent) {
                        return isDelinquent();
                    }
                },
                views: {
                    'content@secured': {
                        template: '<contact-view></contact-view>'
                    }
                },
                onEnter(AppModel) {
                    AppModel.set('contactSidebar', true);
                },
                onExit(contactCache, AppModel) {
                    contactCache.clear();
                    AppModel.set('contactSidebar', false);
                }
            })
            .state('secured.contacts.details', {
                url: '/:id',
                params: { id: null },
                views: {
                    'details@secured.contacts': {
                        template: '<div class="contactsDetails-body"><contact-details ng-if="contact" data-contact="contact"></contact-details><loader-tag></loader-tag></div>',
                        controller($scope, $stateParams, contactCache) {
                            contactCache.find($stateParams.id)
                                .then((data) => $scope.$applyAsync(() => {
                                    $scope.contact = data;
                                }));
                        }
                    }
                }
            });
    });
