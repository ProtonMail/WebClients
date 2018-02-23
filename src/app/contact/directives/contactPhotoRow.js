import { PHOTO_PLACEHOLDER_URL } from '../../constants';

/* @ngInject */
function contactPhotoRow(contactPhotoModal) {
    const HIDE_CLEAR_BUTTON = 'contactPhotoRow-hide-clear-button';
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
            const cleanUri = (uri = '') => uri.replace(PHOTO_PLACEHOLDER_URL, '');
            const updateImage = (uri = '') => {
                scope.uri = uri || PHOTO_PLACEHOLDER_URL;
                scope.value = cleanUri(scope.uri);
                element[0].classList[scope.uri === PHOTO_PLACEHOLDER_URL ? 'add' : 'remove'](HIDE_CLEAR_BUTTON);
            };
            const actions = {
                edit() {
                    contactPhotoModal.activate({
                        params: {
                            uri: scope.value,
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
                },
                clear() {
                    scope.$applyAsync(() => {
                        updateImage(PHOTO_PLACEHOLDER_URL);
                        ngFormController.$setDirty();
                    });
                }
            };

            const onClick = ({ target }) => {
                const action = target.getAttribute('data-action');
                action && actions[action]();
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
