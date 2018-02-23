/* @ngInject */
function contactPhotoRow(contactPhotoModal) {
    const PHOTO_PLACEHOLDER_URL = '/assets/img/photo-placeholder.png';
    return {
        restrict: 'E',
        replace: true,
        require: '^form',
        scope: {
            value: '=',
            form: '='
        },
        templateUrl: require('../../../templates/contact/contactPhotoRow.tpl.html'),
        link(scope, element, attr, ngFormController) {
            const updateImage = (uri) => scope.value = uri || PHOTO_PLACEHOLDER_URL;
            const onClick = () => {
                contactPhotoModal.activate({
                    params: {
                        uri: scope.value === PHOTO_PLACEHOLDER_URL ? '' : scope.value,
                        submit(uri) {
                            contactPhotoModal.deactivate();
                            scope.$applyAsync(() => {
                                updateImage(uri);
                                ngFormController.$setDirty();
                            });
                        },
                        cancel() {
                            contactPhotoModal.deactivate();
                        }
                    }
                });
            };

            element.on('click', onClick);

            updateImage(scope.value);

            scope.$on('$destroy', () => {
                element.off('click', onClick);
            });
        }
    };
}
export default contactPhotoRow;
