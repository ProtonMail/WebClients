/* @ngInject */
function pmSignatureToggle($rootScope, CONSTANTS, mailSettingsModel, signatureModel) {
    const isSignatureMandatory = () => {
        const { PMSignature } = mailSettingsModel.get();
        return PMSignature === 2;
    };
    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/user/pmSignatureToggle.tpl.html'),
        link(scope) {
            const { PMSignature } = mailSettingsModel.get();
            const unsubscribe = $rootScope.$on('changePMSignature', (e, data) => {
                signatureModel.changeProtonStatus(data);
            });

            scope.protonSignature = {
                content: CONSTANTS.PM_SIGNATURE,
                isMandatory: isSignatureMandatory(),
                isActive: !!PMSignature
            };

            scope.$on('$destroy', () => {
                unsubscribe();
            });
        }
    };
}
export default pmSignatureToggle;
