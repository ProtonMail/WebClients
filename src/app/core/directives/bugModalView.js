
/* @ngInject */
function bugModalView() {
    const UPLOADED_CLASS = 'bugModalView-files-uploaded';
    return {
        replace: true,
        restrict: 'E',
        scope: {
            model: '=',
            form: '='
        },
        templateUrl: require('../../../templates/directives/core/bugModalView.tpl.html'),
        link(scope, element) {
            const $input = element[0].querySelector('.bugModalView-input-file');
            const $clear = element[0].querySelector('.bugModalView-clear-upload');
            const onClick = () => {
                element[0].classList.remove(UPLOADED_CLASS);
                scope.$applyAsync(() => {
                    scope.model.fileList = [];
                });
            };
            const onChange = ({ target }) => {
                element[0].classList.add(UPLOADED_CLASS);
                scope.$applyAsync(() => {
                    scope.model.fileList = target.files;
                });
            };

            $input.addEventListener('change', onChange);
            $clear.addEventListener('click', onClick);

            scope.$on('$destroy', () => {
                $input.removeEventListener('change', onChange);
                $clear.removeEventListener('click', onClick);
            });
        }
    };
}

export default bugModalView;
