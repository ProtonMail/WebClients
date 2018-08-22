import { CONTACT_IMG_SIZE } from '../../constants';
import { resizeImage } from '../../../helpers/imageHelper';

/* @ngInject */
function contactPhotoForm(gettextCatalog, notification) {
    const I18N = {
        error: gettextCatalog.getString('Image upload failed', null, 'Error')
    };
    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/contact/contactPhotoForm.tpl.html'),
        link(scope, element) {
            const $input = element[0].querySelector('.contactPhotoModal-input-file');
            const onChange = ({ target }) => {
                const file = target.files[0];
                const reader = new FileReader();

                reader.onloadend = () => {
                    resizeImage(reader.result, CONTACT_IMG_SIZE, 'image/jpeg', 0.7)
                        .then((base64str) => {
                            scope.$applyAsync(() => {
                                scope.ctrl.uri = base64str;
                                scope.ctrl.submit(scope.ctrl.uri);
                            });
                        })
                        .catch((error) => {
                            notification.error(I18N.error);
                            throw error;
                        });
                };

                reader.readAsDataURL(file);
            };

            $input.addEventListener('change', onChange);

            scope.$on('$destroy', () => {
                $input.removeEventListener('change', onChange);
            });
        }
    };
}

export default contactPhotoForm;
