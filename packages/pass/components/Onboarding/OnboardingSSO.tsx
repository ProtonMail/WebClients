import { type FC, useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

import { useLockSetup } from '../../hooks/auth/useLockSetup';
import { LockMode } from '../../lib/auth/lock/types';
import { useOnline } from '../Core/ConnectivityProvider';
import { PassModal } from '../Layout/Modal/PassModal';
import type { WithSpotlightRenderProps } from '../Spotlight/WithSpotlight';
import { OnboardingLockSetup } from './OnboardingLockSetup';

import './OnboardingModal.scss';

export const OnboardingSSO: FC<WithSpotlightRenderProps> = ({ close }) => {
    const { lock } = useLockSetup();
    const online = useOnline();
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
