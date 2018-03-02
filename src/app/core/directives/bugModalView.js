import { isChrome, isFirefox } from '../../../helpers/browser';

/* @ngInject */
function bugModalView() {
    const UPLOADED_CLASS = 'bugModalView-files-uploaded';
    const SUPPORTED_CLASS = 'bugModalView-upload-supported';
    return {
        replace: true,
        restrict: 'E',
        scope: {
            model: '=',
            form: '='
        },
        templateUrl: require('../../../templates/directives/core/bugModalView.tpl.html'),
        link(scope, element) {
            const $input = element.find('.bugModalView-input-file');
            const $clear = element.find('.bugModalView-clear-upload');

            // Screenshot only supported on Firefox and Chrome
            if (isFirefox() || isChrome()) {
                element[0].classList.add(SUPPORTED_CLASS);
            }

            const onChange = ({ target }) => {
                element[0].classList.add(UPLOADED_CLASS);
                scope.$applyAsync(() => {
                    scope.model.fileList = target.files;
                });
            };

            const onClick = () => {
                $input.val('');
                $input.wrap('<form>').closest('form').get(0).reset();
                $input.unwrap();
                element[0].classList.remove(UPLOADED_CLASS);

                scope.$applyAsync(() => {
                    scope.model.fileList = [];
                });
            };

            $input.on('change', onChange);
            $clear.on('click', onClick);

            scope.$on('$destroy', () => {
                $input.off('change', onChange);
                $clear.off('click', onClick);
            });
        }
    };
}

export default bugModalView;
