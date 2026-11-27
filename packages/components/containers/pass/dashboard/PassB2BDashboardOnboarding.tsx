import { useEffect, useRef } from 'react';

import { useAllSubscriptions } from '@proton/account/allSubscriptions/hooks';
import { useEntitlementChecksForOrgAndUser } from '@proton/account/entitlementCatalog/hooks';
import { usePaymentMethods } from '@proton/account/paymentMethods/hooks';
import { useUser } from '@proton/account/user/hooks';
import { FeatureCode } from '@proton/features/interface';
import useFeature from '@proton/features/useFeature';
import { PLANS } from '@proton/payments/core/constants';
import { isTrial } from '@proton/payments/core/subscription/helpers';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { Renew } from '@proton/shared/lib/payments/subscription/constants';
import noop from '@proton/utils/noop';

import useModalState from '../../../components/modalTwo/useModalState';
import SettingsSectionWide from '../../account/SettingsSectionWide';
import PassBasicTrialWelcomeModal from './PassBasicTrialWelcomeModal';
import PassOrgSetupChecklistSection from './PassOrgSetupChecklistSection';
import { getPassOrgSetupStepIds, getShowPassOrgSetupChecklist } from './interface';

const PassTrialWelcomeModalOnce = ({ trialEndDate }: { trialEndDate: number }) => {
    const { feature, update, loading } = useFeature<boolean>(FeatureCode.PassB2BTrialWelcomeModalAcknowledged);
    const isAcknowledged = feature?.Value === true;

    const [modalProps, setModalOpen, renderModal] = useModalState();

    const hasCheckedInitialAcknowledgement = useRef(false);

    useEffect(() => {
        if (loading || hasCheckedInitialAcknowledgement.current) {
            return;
        }
        hasCheckedInitialAcknowledgement.current = true;
        if (!isAcknowledged) {
            setModalOpen(true);
        }
    }, [isAcknowledged, loading]);

    const onClose = () => {
        setModalOpen(false);
        update(true).catch(noop);
    };

    return renderModal ? (
        <PassBasicTrialWelcomeModal {...modalProps} trialEndDate={trialEndDate} onClose={onClose} />
    ) : null;
};

const PassTrialWelcome = ({ trial }: { trial: Subscription }) => {
    const [paymentMethods, loadingPaymentMethods] = usePaymentMethods();

    const isAutoAssignedPassProfessionalTrial =
        !loadingPaymentMethods && trial.Renew === Renew.Disabled && !paymentMethods?.length;

    return isAutoAssignedPassProfessionalTrial ? <PassTrialWelcomeModalOnce trialEndDate={trial.PeriodEnd} /> : null;
};

interface Props {
    app: APP_NAMES;
}

const PassB2BDashboardOnboarding = ({ app }: Props) => {
    const [allSubscriptions, loadingAllSubscriptions] = useAllSubscriptions();
    const [user] = useUser();
    const [entitlements, loadingEntitlements] = useEntitlementChecksForOrgAndUser();

    const passProfessionalTrial = allSubscriptions?.find((subscription) => isTrial(subscription, PLANS.PASS_BUSINESS));

    if (
        loadingAllSubscriptions ||
        loadingEntitlements ||
        !getShowPassOrgSetupChecklist({ app, isAdmin: user.isAdmin, entitlements })
    ) {
        return null;
    }

    return (
        <SettingsSectionWide>
            {passProfessionalTrial && <PassTrialWelcome trial={passProfessionalTrial} />}
            <PassOrgSetupChecklistSection stepIds={getPassOrgSetupStepIds(entitlements)} />
        </SettingsSectionWide>
    );
};

export default PassB2BDashboardOnboarding;
