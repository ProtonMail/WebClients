angular.module('proton.formUtils')
.directive('validatorTypoEmail', (checkTypoEmails) => {

    const warningName = 'typo-email';
    const className = `ng-warning-${warningName}`;

    return {
        link(scope, el) {

            const ngMessages = el[0].nextElementSibling;
            const warningMessage = ngMessages.querySelector(`[ng-message-warning="${warningName}"]`);

            const toggleWarning = (valid) => {
                const method = valid ? 'add' : 'remove';
                el[0].classList[method](className);
                warningMessage.style.display = valid ? 'initial' : 'none';
            };

            const onBlur = ({ target }) => {
                toggleWarning(checkTypoEmails(target.value));
            };

            el[0].addEventListener('blur', onBlur);

            scope.$on('$destroy', () => {
                el[0].removeEventListener('blur', onBlur);
            });
        }
    };
});
