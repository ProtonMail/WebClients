angular.module('proton.squire')
    .directive('plainTextArea', () => {
        return {
            replace: true,
            templateUrl: 'templates/squire/plainTextArea.tpl.html',
            link(scope, elem) {
                const domElement = elem[0];
                // set the selection to the start instead of the end just like with squire.
                // only set it on first load as we should remember the location after first use.
                // (otherwise you start typing after the signature which is bad UX OR even worse after the reply chain)
                // we need to ensure the data is in there, to prevent the selection from changing after ng-model is applied
                domElement.value = scope.message.DecryptedBody;
                domElement.selectionStart = 0;
                domElement.selectionEnd = 0;
            }
        };
    });
