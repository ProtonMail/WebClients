/* @ngInject */
function defaultSignature($rootScope, signatureModel, CONSTANTS, mailSettingsModel, tools) {
    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/user/defaultSignature.tpl.html'),
        link(scope) {
            const unsubscribe = [];
            const { PMSignature } = mailSettingsModel.get();
            scope.protonSignature = {
                content: CONSTANTS.PM_SIGNATURE,
                isMandatory: PMSignature === 2,
                isActive: !!PMSignature
            };
            scope.saveIdentity = () => signatureModel.save(scope);

            const updateUser = () => {
                const { DisplayName, Signature } = mailSettingsModel.get();

                scope.displayName = DisplayName;
                scope.signature = tools.replaceLineBreaks(Signature);
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
