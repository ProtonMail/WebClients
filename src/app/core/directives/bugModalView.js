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
