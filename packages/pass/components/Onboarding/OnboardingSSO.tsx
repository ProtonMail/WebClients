import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components/index';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { OnboardingLockSetup } from '@proton/pass/components/Onboarding/OnboardingLockSetup';
import type { SpotlightModalProps } from '@proton/pass/components/Onboarding/WithSpotlightModal';
import { useLockSetup } from '@proton/pass/hooks/useLockSetup';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

import './OnboardingModal.scss';

export const OnboardingSSO: FC<SpotlightModalProps> = ({ acknowledge, onClose }) => {
    const online = useConnectivity();
    const { lock } = useLockSetup();

    const isPasswordSelected = lock.mode === LockMode.PASSWORD;

    return (
        <PassModal open size="medium" className="pass-onboarding-modal">
            <ModalTwoHeader title={c('Title').t`Change your lock method`} className="justify-start" hasClose={false} />

            <ModalTwoContent>
                <div className="flex items-center gap-6 w-full">
                    <div className="pass-onboarding-modal--lock">
                        <p className="text-bold mt-0">{c('Label').t`Unlock with:`}</p>
                        <OnboardingLockSetup
                            label={{
                                [LockMode.PASSWORD]: (
                                    <>
                                        <span className="mr-2">{c('Label')
                                            .t`Authentication again with your backup password`}</span>
                                        {isPasswordSelected && (
                                            <span className="color-weak text-sm align-end">
                                                ({c('Info').t`Currently selected`})
                                            </span>
                                        )}
                                    </>
                                ),
                            }}
                        />
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter className="mt-0">
                <div className="flex justify-end w-full">
                    <Button pill shape="solid" onClick={pipe(onClose, acknowledge)} disabled={!online}>
                        {c('Action').t`Accept`}
                    </Button>
                </div>
            </ModalTwoFooter>
        </PassModal>
    );
};
