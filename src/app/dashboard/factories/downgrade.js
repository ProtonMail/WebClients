/* @ngInject */
function downgrade(
    $filter,
    authentication,
    confirmModal,
    eventManager,
    gettextCatalog,
    networkActivityTracker,
    notification,
    Payment,
    translator,
    subscriptionModel,
    organizationModel
) {
    const humanSize = $filter('humanSize');
    const FREE_PLAN = { Type: 1, Name: 'free' };
    const I18N = translator(() => ({
        downgradeTitle: gettextCatalog.getString('Confirm downgrade', null, 'Title'),
        downgradeMessage: gettextCatalog.getString(
            'This will downgrade your account to a free account. ProtonMail is free software that is supported by donations and paid accounts. Please consider making a donation so we can continue to offer the service for free.<br /><br />Note: Additional addresses, custom domains, and users must be removed/disabled before performing this action.',
            null,
            'Info'
        ),
        successMessage: gettextCatalog.getString('You have successfully unsubscribed', null, 'Downgrade account'),
        bonusTitle: gettextCatalog.getString('Confirm loss of Proton bonuses', null, 'Title'),
        bonusConfirmText: gettextCatalog.getString('Remove bonuses', null, 'button'),
        bonusMessage(organization) {
            const message = gettextCatalog.getString(
                'As an early Proton user, your account has extra features.',
                null,
                'Info'
            );
            const warn = gettextCatalog.getString(
                'By downgrading to a Free plan, you will permanently lose these benefits, even if you upgrade again in the future.',
                null,
                'Info'
            );
            const items = [
                hasBonuses(organization) &&
                    organization.BonusSpace &&
                    gettextCatalog.getString(
                        '+{{space}} bonus storage',
                        { space: humanSize(organization.BonusSpace) },
                        'Info'
                    ),
                hasBonuses(organization) &&
                    organization.BonusVPN &&
                    gettextCatalog.getPlural(
                        organization.BonusVPN,
                        '+{{vpn}} connection for ProtonVPN (allows you to connect more devices to VPN)',
                        '+{{vpn}} connections for ProtonVPN (allows you to connect more devices to VPN)',
                        { vpn: organization.BonusVPN },
                        'Info'
                    )
            ]
                .filter(Boolean)
                .reduce((acc, item) => {
                    const node = document.createElement('LI');
                    node.textContent = item;
                    acc.appendChild(node);
                    return acc;
                }, document.createElement('UL')).outerHTML;

            return `<p>${message}</p><div class="alert alert-danger"><strong>${warn}</strong>${items}</div>`;
        }
    }));

    function unsubscribe() {
        return Payment.delete()
            .then(() => eventManager.call())
            .then(() => subscriptionModel.set(FREE_PLAN));
    }

    function hasBonuses(organization = {}) {
        return !!organization.Flags || !!organization.LoyaltyCounter;
    }

    async function check() {
        await new Promise((resolve, reject) => {
            confirmModal.activate({
                params: {
                    title: I18N.downgradeTitle,
                    message: I18N.downgradeMessage,
                    confirm() {
                        confirmModal.deactivate();
                        resolve();
                    },
                    cancel() {
                        confirmModal.deactivate();
                        reject();
                    }
                }
            });
        });

        const organization = organizationModel.get();

        if (hasBonuses(organization)) {
            await new Promise((resolve, reject) => {
                // defer modal as there is an issue with the $digest. It won't show the modal
                const id = setTimeout(() => {
                    confirmModal.activate({
                        params: {
                            title: I18N.bonusTitle,
                            message: I18N.bonusMessage(organization),
                            confirmText: I18N.bonusConfirmText,
                            confirmClass: 'error',
                            customAlert: true,
                            confirm() {
                                confirmModal.deactivate();
                                resolve();
                            },
                            cancel() {
                                confirmModal.deactivate();
                                reject();
                            }
                        }
                    });
                    clearTimeout(id);
                }, 300);
            });
        }

        const promise = unsubscribe();
        await networkActivityTracker.track(promise);
        notification.success(I18N.successMessage);
    }

    return check;
}
export default downgrade;
