/* @ngInject */
function composerTime(dispatchers, gettextCatalog) {
    const getTime = ({ Time }) => moment.unix(Time).format('LT');
    const I18N = {
        saveAt: gettextCatalog.getString('Saved at', null, 'Info display in the composer footer'),
        saving: gettextCatalog.getString('Saving', null, 'Info display in the composer footer')
    };

    return {
        restrict: 'E',
        replace: true,
        template: '<time class="composerTime-container"></time>',
        link(scope, element) {
            const { on, unsubscribe } = dispatchers();
            const update = (message) => {
                if (message.saving) {
                    element[0].textContent = I18N.saving;
                    return;
                }

                if (message.Time) {
                    element[0].textContent = `${I18N.saveAt} ${getTime(message)}`;
                }
            };
            on('actionMessage', (event, { data: message }) => {
                scope.message.ID === message.ID && update(message);
            });
            update(scope.message);
            scope.$on('$destroy', unsubscribe);
        }
    };
}
export default composerTime;
