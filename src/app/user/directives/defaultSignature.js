/* @ngInject */
function defaultSignature($rootScope, authentication, gettextCatalog, signatureModel, CONSTANTS, mailSettingsModel, notification, tools) {
    const I18N = {
        SUCCESS_SAVE: gettextCatalog.getString('Default Name / Signature saved', null, "User's signature")
    };
    return {
        scope: {},
        replace: true,
        restrict: 'E',
        templateUrl: require('../../../templates/user/defaultSignature.tpl.html'),
        link(scope) {
            const unsubscribe = [];
            const { PMSignature } = mailSettingsModel.get();
            const isSignatureMandatory = () => {
                const { PMSignature } = mailSettingsModel.get();
                return PMSignature === 2;
            };

            scope.protonSignature = {
                content: CONSTANTS.PM_SIGNATURE,
                isMandatory: isSignatureMandatory(),
                isActive: !!PMSignature
            };

            scope.saveIdentity = () => signatureModel.save(scope).then(() => notification.success(I18N.SUCCESS_SAVE));

            const updateUser = () => {
                const { Addresses = [] } = authentication.user;
                const [{ DisplayName, Signature } = {}] = Addresses;

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
