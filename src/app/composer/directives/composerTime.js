angular.module('proton.composer')
    .directive('composerTime', ($rootScope, gettextCatalog) => {
        const getTime = ({ Time }) => moment.unix(Time).format('LT');
        const saveAt = gettextCatalog.getString('Saved at', null, 'Info display in the composer footer');

        return {
            restrict: 'E',
            replace: true,
            template: '<time class="composerTime-container"></time>',
            link(scope, element) {
                const update = (message) => {
                    if (message.Time) {
                        element[0].textContent = `${saveAt} ${getTime(message)}`;
                    }
                };
                const unsubscribe = $rootScope.$on('actionMessage', (event, message) => {
                    (scope.message.ID === message.ID) && update(message);
                });
                update(scope.message);
                scope.$on('$destroy', unsubscribe);
            }
        };
    });
