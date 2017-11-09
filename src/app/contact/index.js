angular.module('proton.contact', [])
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
                    delinquent($state, gettextCatalog, user, notification) {
                        if (user.Delinquent < 3) {
                            return Promise.resolve();
                        }

                        notification.error(gettextCatalog.getString('Your account currently has an overdue invoice. Please pay all unpaid invoices.', null, 'Info'));
                        $state.go('secured.payments');

                        return Promise.reject();
                    },
                    contacts(user, contactCache) {
                        if (!contactCache.isHydrated()) {
                            return contactCache.hydrate();
                        }
                        return Promise.resolve();
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
                    AppModel.set('contactSidebar', false);
                }
            })
            .state('secured.contacts.details', {
                url: '/:id',
                params: { id: null },
                resolve: {
                    contact(user, contacts, $stateParams, Contact, networkActivityTracker) {
                        return networkActivityTracker.track(Contact.get($stateParams.id));
                    }
                },
                views: {
                    'details@secured.contacts': {
                        template: '<contact-details data-contact="contact"></contact-details>',
                        controller($scope, contact) {
                            $scope.contact = contact;
                        }
                    }
                }
            });
    });
