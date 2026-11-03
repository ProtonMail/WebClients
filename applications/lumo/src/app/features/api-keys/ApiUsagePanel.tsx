import { useMember } from '@proton/account/member/hook';
import { usePaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Autopay, PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { SavedPaymentMethod } from '@proton/payments/core/interface';
import { MEMBER_SUBSCRIBER } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useDebugApiOrganizationMemberView, useDebugApiOrganizationView } from '../../services/apiUsageDebugStore';
import { ApiUsageDashboard } from './ApiUsageDashboard';
import { useCanBuyLumoCredits } from './useCanBuyLumoCredits';

import './ApiKeysPanel.scss';

const asynchronouslyChargedMethodTypes: SavedPaymentMethod['Type'][] = [
    PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT,
    PAYMENT_METHOD_TYPES.CHARGEBEE_IDEAL,
];

const canChargeAutoTopUp = (paymentMethods: SavedPaymentMethod[] = []) => {
    const defaultMethod = paymentMethods.find((method) => method.IsDefault);
    return (
        !!defaultMethod &&
        !asynchronouslyChargedMethodTypes.includes(defaultMethod.Type) &&
        (!('Autopay' in defaultMethod) || defaultMethod.Autopay === Autopay.ENABLE)
    );
};

export const ApiUsagePanel = () => {
    const { isOrgAdmin, userIsMember } = useLumoPlan();
    const [user] = useUser();
    const [member] = useMember();
    const [paymentMethods] = usePaymentMethods();
    const showAutoTopUp = useFlag('LumoAllowAutomaticCreditTopUps');
    const canTopUp = useCanBuyLumoCredits();
    const debugOrganizationView = useDebugApiOrganizationView();
    const debugOrganizationMemberView = useDebugApiOrganizationMemberView();
    const effectiveOrgAdmin = isOrgAdmin || debugOrganizationView;

    return (
        <ApiUsageDashboard
            isOrgAdmin={effectiveOrgAdmin}
            isOrgMember={debugOrganizationMemberView || (!effectiveOrgAdmin && userIsMember)}
            canManageBalance={user.canPay && member?.Subscriber !== MEMBER_SUBSCRIBER.NON_PAYER}
            canChargeAutoTopUp={canChargeAutoTopUp(paymentMethods)}
            showAutoTopUp={showAutoTopUp}
            canTopUp={canTopUp}
        />
    );
};
