/* @ngInject */
function defaultSignature($rootScope, signatureModel, CONSTANTS, mailSettingsModel, tools, addressModel) {
    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/user/defaultSignature.tpl.html'),
        link(scope) {
            const unsubscribe = [];
            const { PMSignature, DisplayName, Signature } = mailSettingsModel.get();

            const checkCustom = (DisplayName, Signature) => {
                const { active: [mainAddress = {}] } = addressModel.getActive() || { active: [] };
                scope.hasCustom = {
                    DisplayName: mainAddress.DisplayName !== DisplayName,
                    Signature: mainAddress.Signature !== Signature
                };
            };
            checkCustom(DisplayName, Signature);

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
                checkCustom(DisplayName, Signature);
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
