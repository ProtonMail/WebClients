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
            const cleanUri = (uri = '') => uri.replace(PHOTO_PLACEHOLDER_URL, '');
            const updateImage = (uri = '') => {
                const value = uri || PHOTO_PLACEHOLDER_URL;

                if (!scope.showImage && REGEX_URL.test(uri)) {
                    scope.uri = PHOTO_PLACEHOLDER_URL;
                    scope.value = cleanUri(value);
                    element[0].classList.add(IMAGE_BLOCKED);
                } else {
                    scope.uri = value;
                    scope.value = cleanUri(value);
                }

                element[0].classList[uri ? 'remove' : 'add'](HIDE_CLEAR_BUTTON);
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
