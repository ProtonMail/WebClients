angular.module('proton.core')
.directive('defaultSignature', ($rootScope, gettextCatalog, $q, eventManager, notify, networkActivityTracker, CONSTANTS, tools, settingsApi, authentication) => {
    return {
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/directives/core/defaultSignature.tpl.html',
        link(scope) {

            const unsubscribe = [];

            const updateUser = () => {
                scope.displayName = authentication.user.DisplayName;
                scope.PMSignature = Boolean(authentication.user.PMSignature);
                scope.signature = tools.replaceLineBreaks(authentication.user.Signature);
            };

            const changePMSignature = (event, status) => {
                const PMSignature = (status) ? 1 : 0;
                const promise = settingsApi.updatePMSignature({ PMSignature })
                .then((result) => {
                    if (result.data && result.data.Code === 1000) {
                        return eventManager.call()
                        .then(() => {
                            notify({ message: gettextCatalog.getString('Signature updated', null, 'Info'), classes: 'notification-success' });
                        });
                    } else if (result.data && result.data.Error) {
                        return Promise.reject(result.data.Error);
                    }
                });

                networkActivityTracker.track(promise);

                return promise;
            };
            // Listeners


            unsubscribe.push($rootScope.$on('changePMSignature', changePMSignature));
            unsubscribe.push($rootScope.$on('updateUser', updateUser));


            scope.signatureContent = CONSTANTS.PM_SIGNATURE;

            scope.saveIdentity = () => {
                const deferred = $q.defer();
                const displayName = scope.displayName;
                let signature = scope.signature;

                signature = signature.replace(/\n/g, '<br />');


                $q.all({
                    displayName: settingsApi.display({ DisplayName: displayName }),
                    signature: settingsApi.signature({ Signature: signature })
                })
                .then((result) => {
                    if (result.displayName.data.Code === 1000 && result.signature.data.Code === 1000) {
                        notify({ message: gettextCatalog.getString('Defaut Name / Signature saved', null), classes: 'notification-success' });
                        eventManager.call()
                        .then(() => {
                            deferred.resolve();
                        });
                    } else if (result.signature.data.Code === 12010) {
                        notify({ message: gettextCatalog.getString('Unable to save your changes, your signature is too large.', null, 'Error'), classes: 'notification-danger' });
                        deferred.reject();
                    } else {
                        notify({ message: gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'), classes: 'notification-danger' });
                        deferred.reject();
                    }
                }, () => {
                    notify({ message: gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'), classes: 'notification-danger' });
                    deferred.reject();
                });

                return networkActivityTracker.track(deferred.promise);
            };

            updateUser();

            scope.$on('$destroy', () => {
                unsubscribe.forEach((cb) => cb());
                unsubscribe.length = 0;
            });

        }
    };
});
