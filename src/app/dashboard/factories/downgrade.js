/* @ngInject */
function downgrade(
    confirmModal,
    eventManager,
    gettextCatalog,
    networkActivityTracker,
    notification,
    Payment,
    translator,
    subscriptionModel
) {
    const FREE_PLAN = { Type: 1, Name: 'free' };
    const I18N = translator(() => ({
        downgradeTitle: gettextCatalog.getString('Confirm downgrade', null, 'Title'),
        downgradeMessage: gettextCatalog.getString(
            'This will downgrade your account to a free account. ProtonMail is free software that is supported by donations and paid accounts. Please consider making a donation so we can continue to offer the service for free.<br /><br />Note: Additional addresses, custom domains, and users must be removed/disabled before performing this action.',
            null,
            'Info'
        ),
        successMessage: gettextCatalog.getString('You have successfully unsubscribed', null, 'Downgrade account')
    }));

    function unsubscribe() {
        return Payment.delete()
            .then(() => eventManager.call())
            .then(() => subscriptionModel.set(FREE_PLAN));
    }

    return () => {
        confirmModal.activate({
            params: {
                title: I18N.downgradeTitle,
                message: I18N.downgradeMessage,
                confirm() {
                    const promise = unsubscribe().then(() => {
                        confirmModal.deactivate();
                        notification.success(I18N.successMessage);
                    });

                    networkActivityTracker.track(promise);
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };
}
export default downgrade;
