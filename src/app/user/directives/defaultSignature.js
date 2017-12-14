/* @ngInject */
function defaultSignature($rootScope, signatureModel, CONSTANTS, authentication, tools) {
    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: 'templates/user/defaultSignature.tpl.html',
        link(scope) {
            const unsubscribe = [];
            scope.protonSignature = {
                content: CONSTANTS.PM_SIGNATURE,
                isMandatory: authentication.user.PMSignature === 2,
                isActive: !!authentication.user.PMSignature
            };
            scope.saveIdentity = () => signatureModel.save(scope);

            const updateUser = () => {
                scope.displayName = authentication.user.DisplayName;
                scope.signature = tools.replaceLineBreaks(authentication.user.Signature);
            };

            unsubscribe.push(
                $rootScope.$on('changePMSignature', (e, data) => {
                    signatureModel.changeProtonStatus(data);
                })
            );
            unsubscribe.push($rootScope.$on('updateUser', updateUser));

            updateUser();

            scope.$on('$destroy', () => {
                unsubscribe.forEach((cb) => cb());
                unsubscribe.length = 0;
            });
        }
    };
}
export default defaultSignature;
