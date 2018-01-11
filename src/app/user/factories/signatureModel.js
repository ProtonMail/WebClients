/* @ngInject */
function signatureModel(AppModel, sanitize, settingsMailApi, eventManager, notification, gettextCatalog, networkActivityTracker) {
    const I18N = {
        SUCCESS_UPDATE: gettextCatalog.getString('Signature updated', null, 'Info'),
        SUCCESS_SAVE: gettextCatalog.getString('Default Name / Signature saved', null, "User's signature"),
        ERROR_SAVE_INPUT: gettextCatalog.getString('Unable to save your changes, your signature is too large.', null, 'Error'),
        ERROR_SAVE: gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error')
    };

    const changePMSignature = async (status) => {
        const PMSignature = +!!status;
        await settingsMailApi.updatePMSignature({ PMSignature });
        await eventManager.call();
        AppModel.set('protonSignature', !!status);
        return notification.success(I18N.SUCCESS_UPDATE);
    };

    const saveIdentity = async (displayName, signature) => {
        const Signature = signature.replace(/\n/g, '<br />');
        const DisplayName = sanitize.input(displayName);

        const [displayNameData = {}, signatureData = {}] = await Promise.all([
            settingsMailApi.updateDisplayName({ DisplayName }),
            settingsMailApi.updateSignature({ Signature })
        ]);

        // USER_UPDATE_SIGNATURE_TOO_LARGE
        if (signatureData.Code === 12010) {
            throw new Error(I18N.ERROR_SAVE_INPUT);
        }

        if (signatureData.Code !== 1000 || displayNameData.Code !== 1000) {
            throw new Error(I18N.ERROR_SAVE);
        }

        await eventManager.call();
        return notification.success(I18N.SUCCESS_SAVE);
    };

    const save = ({ displayName, signature }) => networkActivityTracker.track(saveIdentity(displayName, signature));
    const changeProtonStatus = ({ status }) => networkActivityTracker.track(changePMSignature(status));

    return {
        save,
        changeProtonStatus
    };
}
export default signatureModel;
