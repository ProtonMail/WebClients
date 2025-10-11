import { type FC, useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { OnboardingLockSetup } from '@proton/pass/components/Onboarding/OnboardingLockSetup';
import type { WithSpotlightRenderProps } from '@proton/pass/components/Spotlight/WithSpotlight';
import { useLockSetup } from '@proton/pass/hooks/useLockSetup';
import { LockMode } from '@proton/pass/lib/auth/lock/types';

import './OnboardingModal.scss';

export const OnboardingSSO: FC<WithSpotlightRenderProps> = ({ close }) => {
    const { lock } = useLockSetup();
    const online = useConnectivity();
    const lockModeIsNotPreferred = lock.mode === LockMode.NONE;

    useEffect(() => {
        /* Only display the modal if the Lock Mode is Password or None */
        if (!lockModeIsNotPreferred) close();
    }, []);

    return (
        online &&
        lockModeIsNotPreferred && (
            <PassModal open size="medium" className="pass-onboarding-modal">
                <ModalTwoHeader
                    title={c('Title').t`Change your lock method`}
                    className="justify-start"
                    hasClose={false}
                />

                <ModalTwoContent>
                    <div className="flex items-center gap-6 w-full">
                        <div className="pass-onboarding-modal--lock">
                            <p className="text-bold mt-0">{c('Label').t`Unlock with:`}</p>
                            <OnboardingLockSetup />
                        </div>
                    </div>
                </ModalTwoContent>
                <ModalTwoFooter className="mt-0">
                    <div className="flex justify-end w-full">
                        <Button pill shape="solid" onClick={close} disabled={!online}>
                            {c('Action').t`Accept`}
                        </Button>
                    </div>
                </ModalTwoFooter>
            </PassModal>
        )
    );
};
