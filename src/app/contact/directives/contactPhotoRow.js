import { REMOTE, PHOTO_PLACEHOLDER_URL, REGEX_URL } from '../../constants';

/* @ngInject */
function contactPhotoRow(contactPhotoModal, mailSettingsModel) {
    const HIDE_CLEAR_BUTTON = 'contactPhotoRow-hide-clear-button';
    const IMAGE_BLOCKED = 'contactPhotoRow-image-blocked';
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
            const updateImage = (uri = '') => {
                const blockImage = !scope.showImage && REGEX_URL.test(uri);

                scope.uri = blockImage ? PHOTO_PLACEHOLDER_URL : uri || PHOTO_PLACEHOLDER_URL;
                scope.value = uri;

                element[0].classList[uri ? 'remove' : 'add'](HIDE_CLEAR_BUTTON);
                element[0].classList[blockImage ? 'add' : 'remove'](IMAGE_BLOCKED);
            };

            const actions = {
                edit() {
                    contactPhotoModal.activate({
                        params: {
                            uri: scope.value,
                            submit(uri) {
                                contactPhotoModal.deactivate();
                                scope.$applyAsync(() => {
                                    scope.showImage = true;
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
                        updateImage();
                        ngFormController.$setDirty();
                    });
                },
                load() {
                    scope.$applyAsync(() => {
                        scope.showImage = true;
                        scope.uri = scope.value || PHOTO_PLACEHOLDER_URL;
                        element[0].classList.remove(IMAGE_BLOCKED);
                    });
                }
            };

            const onClick = ({ target }) => {
                const action = target.getAttribute('data-action');
                action && actions[action]();
            };

            scope.showImage = mailSettingsModel.get('ShowImages') & REMOTE;

            element.on('click', onClick);

            updateImage(scope.value);

            scope.$on('$destroy', () => {
                element.off('click', onClick);
            });
        }
    };
}
export default contactPhotoRow;
