
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
            const $input = element.find('.bugModalView-input-file');
            const $clear = element.find('.bugModalView-clear-upload');
            const onClick = ({ target }) => {
                element[0].classList.remove(UPLOADED_CLASS);
                target.value = ''; // Clear the input file
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
