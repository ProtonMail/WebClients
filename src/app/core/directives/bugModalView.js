import _ from 'lodash';

/* @ngInject */
function bugModalView(gettextCatalog, notification) {
    const UPLOADED_CLASS = 'bugModalView-files-uploaded';
    const I18N = {
        noImageSelected: gettextCatalog.getString('No image selected', null, 'Error notification in the bug report modal when the user upload file')
    };
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
                const images = _.filter(target.files, ({ type }) => /^image\//i.test(type));

                if (images.length) {
                    element[0].classList.add(UPLOADED_CLASS);

                    scope.$applyAsync(() => {
                        scope.model.fileList = images;
                    });
                } else {
                    notification.error(I18N.noImageSelected);
                }
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
