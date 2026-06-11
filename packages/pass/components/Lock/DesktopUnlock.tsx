import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcFingerprint } from '@proton/icons/icons/IcFingerprint';
import { IcPassLockmodeBiometrics } from '@proton/icons/icons/IcPassLockmodeBiometrics';
import { useOffline } from '@proton/pass/components/Core/ConnectivityProvider';
import { useAutoDesktopUnlock } from '@proton/pass/hooks/auth/useDesktopUnlock';
import { isMac } from '@proton/shared/lib/helpers/browser';
import noop from '@proton/utils/noop';

type Props = {
    offlineEnabled?: boolean;
    onOffline?: () => void;
};

export const DesktopUnlock: FC<Props> = ({ offlineEnabled, onOffline }) => {
    const offline = useOffline();
    const { loading, onUnlock } = useAutoDesktopUnlock();

    return (
        <>
            <Button
                pill
                shape="solid"
                color="norm"
                className="w-full"
                loading={loading}
                disabled={loading || offline}
                onClick={() => onUnlock().catch(noop)}
            >
                {isMac() ? <IcFingerprint className="mr-1" /> : <IcPassLockmodeBiometrics className="mr-1" />}
                {c('Action').t`Unlock`}
            </Button>

            {/* FIXME: When supporting offline unlocking via desktop unlock we can remove this CTA */}
            {offline && offlineEnabled && !loading && (
                <Button pill shape="ghost" color="norm" className="w-full mt-3" onClick={onOffline}>
                    {c('Action').t`Unlock offline with password`}
                </Button>
            )}
        </>
    );
};
