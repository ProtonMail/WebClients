angular.module('proton.payment')
    .factory('paymentPlansFormator', (CONSTANTS, gettextCatalog) => {

        const I18N = {
            MSG_PER_DAY: gettextCatalog.getString('Messages per day', null),
            LABELS: gettextCatalog.getString('Labels', null),
            FOLDERS: gettextCatalog.getString('Folders', null),
            UNLIMITED_LABELS: gettextCatalog.getString('Unlimited Folders / Unlimited labels', null),
            SUPPORT: gettextCatalog.getString('Support', null),
            LIMITED_SUPPORT: gettextCatalog.getString('Limited support', null),
            PRIORITY_SUPPORT: gettextCatalog.getString('Priority support', null),
            UNLIMITED_SENDING: gettextCatalog.getString('Unlimited sending', null)
        };

        const msgPerDay = (total) => `${total} ${I18N.MSG_PER_DAY}`;
        const numberLabels = (totalFolders, totalLabels) => `${totalFolders} ${I18N.FOLDERS} / ${totalLabels} ${I18N.LABELS}`;

        return (Currency, Cycle) => ({ data = {} } = {}) => {

            if (data.Code === 1000) {
                // Add free plan
                data.Plans.unshift({
                    Type: 1,
                    Cycle,
                    Currency,
                    Name: 'free',
                    Title: 'ProtonMail Free',
                    Amount: 0,
                    MaxDomains: 0,
                    MaxAddresses: 1,
                    MaxSpace: 500 * CONSTANTS.BASE_SIZE * CONSTANTS.BASE_SIZE,
                    MaxMembers: 1,
                    TwoFactor: 0
                });

                data.Plans.forEach((plan) => {
                    switch (plan.Name) {
                        case 'free':
                            plan.sending = msgPerDay(150);
                            plan.labels = numberLabels(3, 20);
                            plan.support = I18N.LIMITED_SUPPORT;
                            break;
                        case 'plus':
                            plan.sending = msgPerDay(1000);
                            plan.labels = numberLabels(20, 200);
                            plan.support = I18N.SUPPORT;
                            break;
                        case 'business':
                            plan.sending = '???';
                            plan.labels = '???';
                            plan.support = '???';
                            break;
                        case 'visionary':
                            plan.sending = I18N.UNLIMITED_SENDING;
                            plan.labels = I18N.UNLIMITED_LABELS;
                            plan.support = I18N.PRIORITY_SUPPORT;
                            break;
                        case 'vpnbasic':
                            plan.support = I18N.SUPPORT;
                            break;
                        case 'vpnplus':
                            plan.support = I18N.PRIORITY_SUPPORT;
                            break;
                        default:
                            break;
                    }
                });
            }

            data.Plans = data.Plans;
            return data;
        };
    });
