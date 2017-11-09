angular.module('proton.ui')
    .directive('progressBar', ($rootScope, CONSTANTS) => {
        const { UPLOAD_GRADIENT_DARK, UPLOAD_GRADIENT_LIGHT } = CONSTANTS;
        const UPLOADING_CLASS = 'progressBar-uploading';
        const UPLOADED_CLASS = 'progressBar-uploaded';
        const getProgressStyle = (progress = 0) => {
            return `linear-gradient(90deg, rgba(${UPLOAD_GRADIENT_DARK}, 1) ${+progress}%, rgba(${UPLOAD_GRADIENT_LIGHT}, 1) 0%)`;
        };
        return {
            restrict: 'E',
            replace: true,
            template: `<div class="progressBar-container ${UPLOADING_CLASS}"></div>`,
            link(scope, element, { id = 'progress' }) {
                const unsubscribe = $rootScope.$on('progressBar', (event, { type = '', data = {} }) => {
                    if (id === type) {
                        element[0].style.background = getProgressStyle(data.progress);

                        if (data.progress === 100) {
                            element[0].classList.add(UPLOADED_CLASS);
                            element[0].classList.remove(UPLOADING_CLASS);
                        }
                    }
                });

                element[0].style.background = getProgressStyle(1);
                scope.$on('$destroy', unsubscribe);
            }
        };
    });
