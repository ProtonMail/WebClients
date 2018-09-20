/* @ngInject */
function signatureModel(
    addressesModel,
    Address,
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
        return notification.success(I18N.SUCCESS_UPDATE);
    };

    const getFirstID = () => {
        const [{ ID }] = addressesModel.get();

        return ID;
    };

    /**
     * Signature can be null, we sanitize it if it's defined -> a string
     * In case the editor is empty, it returns <div><br /></div> so we consider it as an empty string
     * @param  {String} signature
     * @return {String}
     */
    const formatSignature = (signature) => {
        if (signature === '<div><br /></div>') {
            return '';
        }

        if (signature) {
            return sanitize.message(signature.replace(/\n/g, '<br />'));
        }

        return signature;
    };

    const saveIdentity = async (ID, displayName, signature) => {
        // DisplayName and Signature can be set to null
        const DisplayName = displayName ? sanitize.input(displayName) : displayName;
        const Signature = formatSignature(signature);

        await Address.edit(ID, { DisplayName, Signature });
        return eventManager.call();
    };

    const save = ({ ID = getFirstID(), DisplayName, Signature }) =>
        networkActivityTracker.track(saveIdentity(ID, DisplayName, Signature));
    const changeProtonStatus = (status) => networkActivityTracker.track(changePMSignature(status));

    return {
        save,
        changeProtonStatus
    };
}
export default signatureModel;
