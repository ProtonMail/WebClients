import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps, OnboardingStepRenderCallback } from '@proton/components';
import { OnboardingContent, OnboardingModal, OnboardingStep } from '@proton/components';
import { DOCS_APP_NAME } from '@proton/shared/lib/constants';
import sharingOnboardingWelcome from '@proton/styles/assets/img/onboarding/drive-docs.svg';

import useActiveShare from '../../hooks/drive/useActiveShare';
import { useDocumentActions } from '../../store/_documents';
import { Actions, countActionWithTelemetry } from '../../utils/telemetry';

const DriveDocsOnboardingModal = (props: ModalProps) => {
    const { activeFolder } = useActiveShare();
    const { createDocument } = useDocumentActions();

    const onboardingSteps = [
        ({ onNext }: OnboardingStepRenderCallback) => (
            <OnboardingStep>
                <OnboardingContent
                    title={
                        // translator: Introducing Proton Docs
                        c('Onboarding Info').t`Introducing ${DOCS_APP_NAME}`
                    }
                    description={c('Onboarding Info')
                        .t`Create and collaborate on documents. It's all protected by end-to-end encryption.`}
                    img={<img src={sharingOnboardingWelcome} alt={DOCS_APP_NAME} />}
                />
                <footer className="flex gap-4">
                    <Button
                        size="large"
                        color="norm"
                        fullWidth
                        onClick={() => {
                            void createDocument({
                                shareId: activeFolder.shareId,
                                parentLinkId: activeFolder.linkId,
                            });
                            onNext();
                        }}
                    >
                        {c('Onboarding Action').t`Create new document`}
                    </Button>
                    <Button
                        size="large"
                        color="norm"
                        shape="ghost"
                        fullWidth
                        onClick={() => {
                            countActionWithTelemetry(Actions.DismissDocsOnboardingModal);
                            onNext();
                        }}
                        data-testid="drive-onboarding-dismiss"
                    >
                        {c('Onboarding Action').t`Try it later`}
                    </Button>
                </footer>
            </OnboardingStep>
        ),
    ];

    return <OnboardingModal {...props}>{onboardingSteps}</OnboardingModal>;
};

export default DriveDocsOnboardingModal;
