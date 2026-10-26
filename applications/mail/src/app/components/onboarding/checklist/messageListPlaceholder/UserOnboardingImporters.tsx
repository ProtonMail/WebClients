import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import ProviderCard from '@proton/activation/src/components/SettingsArea/ProviderCards/ProviderCard';
import useBYOEFeatureStatus from '@proton/activation/src/hooks/useBYOEFeatureStatus';
import { EASY_SWITCH_SOURCES } from '@proton/activation/src/interface';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { Button } from '@proton/atoms/Button/Button';
import { APPS, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { ChecklistKey } from '@proton/shared/lib/interfaces';
import checklistImportersImg from '@proton/styles/assets/img/illustrations/checklist-importers.svg';

import { useGetStartedChecklist } from '../../../../containers/onboardingChecklist/provider/GetStartedChecklistProvider';
import { CHECKLIST_ACTIONS, CHECKLIST_STEPS } from '../../../../telemetry/checklistEvents';
import { useChecklistTracking } from '../../../../telemetry/useChecklistTracking';

interface Props {
    goToNextStep: () => void;
}

export const UserOnboardingImporters = ({ goToNextStep }: Props) => {
    const [hasAccessToBYOE] = useBYOEFeatureStatus();
    const { markItemsAsDone, setByoeFlowInProgress } = useGetStartedChecklist();
    const tracking = useChecklistTracking();
    const stepModal = useEasySwitchSelector((state) => state.byoeFlow.stepModal);
    const prevStepModalRef = useRef(stepModal);

    useEffect(() => {
        tracking.trackStepLoaded(CHECKLIST_STEPS.importersScreen);
        // eslint-disable-next-line react-hooks/exhaustive-deps -- the tracking functions are recreated on every render
    }, []);

    useEffect(() => {
        const prev = prevStepModalRef.current;
        prevStepModalRef.current = stepModal;

        if (prev === 'success' && stepModal === null) {
            setByoeFlowInProgress(false);
            void markItemsAsDone(ChecklistKey.Import);
            goToNextStep();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: effect watches stepModal transitions only
    }, [stepModal]);

    return (
        <>
            <div
                data-testid="onboarding-importers"
                className="m-auto max-w-custom py-6"
                style={{ '--max-w-custom': '28rem' }}
            >
                <div className="text-center mb-4 mx-4">
                    <img src={checklistImportersImg} alt="" className="mb-4" width={128} />
                    <h1 className="text-lg text-semibold mb-3">{c('Onboarding List Placeholder')
                        .t`Bring your emails into ${MAIL_APP_NAME}`}</h1>
                    <p className="color-weak m-0 mb-4">
                        {c('Onboarding List Placeholder')
                            .t`Bring your existing emails into ${MAIL_APP_NAME} so you can manage everything from one private inbox.`}
                    </p>
                </div>
                <ProviderCard
                    app={APPS.PROTONMAIL}
                    hasBorders={false}
                    showAdvancedImport={false}
                    header={
                        <span className="text-sm color-weak">{c('Onboarding List Placeholder')
                            .t`Choose a provider`}</span>
                    }
                    onBYOEFlowStart={() => setByoeFlowInProgress(true)}
                    onProviderClick={(provider) => tracking.trackProviderSelected(provider)}
                    onComplete={async () => {
                        await markItemsAsDone(ChecklistKey.Import);
                        goToNextStep();
                    }}
                    source={
                        hasAccessToBYOE
                            ? EASY_SWITCH_SOURCES.MAIL_WEB_CHECKLIST_BYOE
                            : EASY_SWITCH_SOURCES.MAIL_WEB_CHECKLIST
                    }
                />
                <div className="text-center mb-4">
                    <Button
                        shape="underline"
                        className="color-weak text-sm"
                        onClick={() => {
                            tracking.trackStepInteracted(CHECKLIST_STEPS.importersScreen, CHECKLIST_ACTIONS.skip);
                            goToNextStep();
                        }}
                    >{c('Onboarding List Placeholder').t`Maybe later`}</Button>
                </div>
            </div>
        </>
    );
};
