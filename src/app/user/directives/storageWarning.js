/* @ngInject */
function storageWarningView(storageWarning) {
    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/user/storageWarning.tpl.html'),
        link(scope, el) {
            const link = el[0].querySelector('.link');

            const onClick = (e) => {
                e.preventDefault();
                storageWarning.showModal();
            };

            link.addEventListener('click', onClick);

            scope.$on('$destroy', () => {
                link.removeEventListener('click', onClick);
            });
        }
    };
}

export default storageWarningView;
