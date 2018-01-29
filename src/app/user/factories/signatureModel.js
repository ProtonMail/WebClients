/* @ngInject */
function signatureModel(
    authentication,
    Address,
    AppModel,
    sanitize,
    settingsMailApi,
    eventManager,
    notification,
    gettextCatalog,
    networkActivityTracker
) {
    const I18N = {
        SUCCESS_UPDATE: gettextCatalog.getString('Signature updated', null, 'Info')
    };

    const changePMSignature = async (status) => {
        const PMSignature = +!!status;
        await settingsMailApi.updatePMSignature({ PMSignature });
        await eventManager.call();
        AppModel.set('protonSignature', !!status);
        return notification.success(I18N.SUCCESS_UPDATE);
    };

    const getFirstID = () => {
        const { Addresses = [] } = authentication.user;
        const [{ ID }] = Addresses;

        return ID;
    };

    const saveIdentity = async (ID, displayName, signature) => {
        const Signature = signature.replace(/\n/g, '<br />');
        const DisplayName = sanitize.input(displayName);

        await Address.edit(ID, { DisplayName, Signature });
        return eventManager.call();
    };

    const save = ({ id = getFirstID(), displayName, signature }) => networkActivityTracker.track(saveIdentity(id, displayName, signature));
    const changeProtonStatus = ({ status }) => networkActivityTracker.track(changePMSignature(status));

    return {
        save,
        changeProtonStatus
    };
}
export default signatureModel;
