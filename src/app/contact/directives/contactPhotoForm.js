import { resizeImage } from '../../../helpers/imageHelper';
/* @ngInject */
function contactPhotoForm() {
    return {
        restrict: 'E',
        replace: true,
        templateUrl: require('../../../templates/contact/contactPhotoForm.tpl.html'),
        link(scope, element) {
            // We estimate to have a light image by setting 65px
            const maxWidth = 65; // px
            const $input = element[0].querySelector('.contactPhotoModal-input-file');
            const onChange = ({ target }) => {
                const file = target.files[0];
                const reader = new FileReader();

                reader.onloadend = () => {
                    resizeImage(reader.result, maxWidth, 'image/jpeg', 0.7)
                        .then((base64str) => {
                            scope.$applyAsync(() => {
                                this.uri = base64str;
                                this.submit(this.uri);
                            });
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
