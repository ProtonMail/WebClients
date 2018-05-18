import _ from 'lodash';

/* @ngInject */
function addFile() {
    const IMAGE_CSS_LOADING = 'addFile-image-loading';
    const IMAGE_CSS_LOADED = 'addFile-image-loaded';
    const IMAGE_CSS_ERROR = 'addFile-image-error';
    const IMAGE_CSS_EMPTY = 'addFile-image-empty';

    return {
        replace: true,
        scope: {
            form: '=',
            image: '='
        },
        restrict: 'E',
        templateUrl: require('../../../templates/squire/addFile.tpl.html'),
        link(scope, $el) {
            const el = $el[0];
            const urlInput = el.querySelector('.addFile-addressInput');
            const imagePreview = el.querySelector('.addFile-preview');

            /**
             * Set the form validation of this url to be valid.
             * @param {Boolean} valid
             */
            const setUrlValid = (valid) => {
                scope.$applyAsync(() => {
                    // Race condition: this can happen if the modal is closed, and the image loads after.
                    const { form = {} } = scope || {};
                    if (!form.addressInput) {
                        return;
                    }
                    form.addressInput.$setValidity('valid', valid);
                });
            };

            /**
             * When the image loading succeeds, add the success class.
             */
            imagePreview.onload = () => {
                el.classList.remove(IMAGE_CSS_LOADING, IMAGE_CSS_EMPTY);
                el.classList.add(IMAGE_CSS_LOADED);
                setUrlValid(true);
            };
            /**
             * When the image loading fails, add the error CSS class.
             */
            imagePreview.onerror = () => {
                el.classList.remove(IMAGE_CSS_LOADING, IMAGE_CSS_EMPTY);
                el.classList.add(IMAGE_CSS_ERROR);
                setUrlValid(false);
            };

            /**
             * When the image URL has been changed, add the appropiate CSS classes.
             * @param {String} value
             */
            const onUrlChange = (value) => {
                imagePreview.removeAttribute('src');
                el.classList.remove(IMAGE_CSS_LOADED, IMAGE_CSS_ERROR);

                if (!value) {
                    el.classList.add(IMAGE_CSS_EMPTY);
                    return;
                }

                setUrlValid(false);
                el.classList.add(IMAGE_CSS_LOADING);
                imagePreview.setAttribute('src', value);
            };

            /**
             * Event listener for input change.
             */
            const onValueChange = _.debounce((e) => {
                onUrlChange(e.target.value);
            }, 300);

            onUrlChange(scope.image.src);

            el.querySelector('input').focus();

            urlInput.addEventListener('input', onValueChange);
            urlInput.addEventListener('change', onValueChange);

            scope.$on('$destroy', () => {
                urlInput.removeEventListener('input', onValueChange);
                urlInput.removeEventListener('change', onValueChange);
            });
        }
    };
}

export default addFile;
