import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ModalTwoContent, ModalTwoFooter, ModalTwoHeader, useModalState } from '@proton/components/index';
import { useConnectivity } from '@proton/pass/components/Core/ConnectivityProvider';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { OnboardingLockSetup } from '@proton/pass/components/Onboarding/OnboardingLockSetup';
import { useLockSetup } from '@proton/pass/hooks/useLockSetup';
import { LockMode } from '@proton/pass/lib/auth/lock/types';
import { SpotlightMessage } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import noop from '@proton/utils/noop';

import './OnboardingModal.scss';

export const OnboardingSSO = () => {
    const online = useConnectivity();
    const { spotlight } = usePassCore();
    const [{ open, onClose }, setModal] = useModalState();
    const { lock } = useLockSetup();

    const isPasswordSelected = lock.mode === LockMode.PASSWORD;

    useEffect(() => {
        (async () => (await spotlight.check(SpotlightMessage.SSO_CHANGE_LOCK)) ?? false)().then(setModal).catch(noop);
    }, []);

    return (
        open && (
            <PassModal open size="medium" className="pass-onboarding-modal">
                <ModalTwoHeader
                    title={c('Title').t`Change your lock method`}
                    className="justify-start"
                    hasClose={false}
                />

                <ModalTwoContent>
                    <div className="flex items-center gap-6 text-left w-full">
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
                        <Button
                            pill
                            shape="solid"
                            onClick={pipe(onClose, () => spotlight.acknowledge(SpotlightMessage.SSO_CHANGE_LOCK))}
                            disabled={!online}
                        >
                            {c('Action').t`Accept`}
                        </Button>
                    </div>
                </ModalTwoFooter>
            </PassModal>
        )
    );
};
