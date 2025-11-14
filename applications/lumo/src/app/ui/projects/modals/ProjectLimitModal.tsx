import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalProps } from '@proton/components';
import {
    Loader,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useSubscriptionModal,
} from '@proton/components';
import { usePreferredPlansMap } from '@proton/components/hooks/usePreferredPlansMap';
import { CYCLE, PLANS } from '@proton/payments';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import './ProjectLimitModal.scss';

export const ProjectLimitModal = ({ ...modalProps }: ModalProps) => {
    const [openSubscriptionModal] = useSubscriptionModal();
    const { plansMapLoading } = usePreferredPlansMap();

    const handleUpgrade = () => {
        modalProps.onClose();

        openSubscriptionModal({
            disablePlanSelection: true,
            maximumCycle: CYCLE.YEARLY,
            plan: PLANS.LUMO,
            metrics: {
                source: 'upsells',
            },
        });
    };

    if (plansMapLoading) {
        return <Loader />;
    }

    return (
        <ModalTwo {...modalProps} size="small">
            <ModalTwoHeader title={c('collider_2025:Title').t`Upgrade to ${LUMO_SHORT_APP_NAME} Plus`} />
            <ModalTwoContent>
                <div className="project-limit-modal-content">
                    <div className="project-limit-modal-icon mb-4">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="24" cy="24" r="20" fill="#6D4AFF" opacity="0.1" />
                            <path
                                d="M24 16V26M24 30V32M34 24C34 29.5228 29.5228 34 24 34C18.4772 34 14 29.5228 14 24C14 18.4772 18.4772 14 24 14C29.5228 14 34 18.4772 34 24Z"
                                stroke="#6D4AFF"
                                strokeWidth="2"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>

                    <h3 className="text-bold mb-2">
                        {c('collider_2025:Title').t`Free users can create 1 project`}
                    </h3>

                    <p className="color-weak mb-4">
                        {c('collider_2025:Info')
                            .t`Upgrade to ${LUMO_SHORT_APP_NAME} Plus to create unlimited projects and unlock advanced AI models, faster responses, and priority access.`}
                    </p>

                    <div className="project-limit-features">
                        <div className="project-limit-feature">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M7 10L9 12L13 8M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z"
                                    stroke="#6D4AFF"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <span>{c('collider_2025:Feature').t`Unlimited projects`}</span>
                        </div>
                        <div className="project-limit-feature">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M7 10L9 12L13 8M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z"
                                    stroke="#6D4AFF"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <span>{c('collider_2025:Feature').t`Advanced AI models`}</span>
                        </div>
                        <div className="project-limit-feature">
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M7 10L9 12L13 8M19 10C19 14.9706 14.9706 19 10 19C5.02944 19 1 14.9706 1 10C1 5.02944 5.02944 1 10 1C14.9706 1 19 5.02944 19 10Z"
                                    stroke="#6D4AFF"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                            <span>{c('collider_2025:Feature').t`Priority access & faster responses`}</span>
                        </div>
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={modalProps.onClose} shape="outline">
                    {c('collider_2025:Action').t`Cancel`}
                </Button>
                <Button color="norm" onClick={handleUpgrade}>
                    {c('collider_2025:Action').t`Upgrade to Plus`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

