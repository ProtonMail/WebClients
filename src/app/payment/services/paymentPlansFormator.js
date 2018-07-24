import { BASE_SIZE } from '../../constants';

/* @ngInject */
function paymentPlansFormator(gettextCatalog) {
    const I18N = {
        MSG_PER_DAY: gettextCatalog.getString('Messages per day', null, 'Plan feature'),
        LABELS: gettextCatalog.getString('Labels', null, 'Plan feature'),
        FOLDERS: gettextCatalog.getString('Folders', null, 'Plan feature'),
        UNLIMITED_LABELS: gettextCatalog.getString('Unlimited Folders / Unlimited labels', null, 'Plan feature'),
        SUPPORT: gettextCatalog.getString('Support', null, 'Plan feature'),
        LIMITED_SUPPORT: gettextCatalog.getString('Limited support', null, 'Plan feature'),
        PRIORITY_SUPPORT: gettextCatalog.getString('Priority support', null, 'Plan feature'),
        UNLIMITED_SENDING: gettextCatalog.getString('Unlimited sending', null, 'Plan feature')
    };

    const msgPerDay = (total) => `${total} ${I18N.MSG_PER_DAY}`;
    const numberLabels = (totalFolders, totalLabels) =>
        `${totalFolders} ${I18N.FOLDERS} / ${totalLabels} ${I18N.LABELS}`;

    return (Currency, Cycle) => ({ data = {} } = {}) => {
        const plans = data.Plans;
        // Add free plan
        plans.unshift({
            Type: 1,
            Cycle,
            Currency,
            Name: 'free',
            Title: 'ProtonMail Free',
            Amount: 0,
            MaxDomains: 0,
            MaxAddresses: 1,
            MaxSpace: 500 * BASE_SIZE * BASE_SIZE,
            MaxMembers: 1,
            TwoFactor: 0
        });

        plans.forEach((plan) => {
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
                case 'professional':
                    plan.sending = I18N.UNLIMITED_SENDING;
                    plan.labels = I18N.UNLIMITED_LABELS;
                    plan.support = I18N.PRIORITY_SUPPORT;
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

        return {
            ...data,
            Plans: plans
        };
    };
}
export default paymentPlansFormator;
