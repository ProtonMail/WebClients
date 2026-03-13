import type { FC } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import { useAutoUnlock } from '@proton/pass/hooks/auth/useAutoUnlock';
import { useDesktopUnlock } from '@proton/pass/hooks/auth/useDesktopUnlock';
import { isMac } from '@proton/shared/lib/helpers/browser';

type Props = {
    onSuccess?: () => void;
    onFailure?: () => void;
};

export const DesktopUnlock: FC<Props> = ({ onSuccess, onFailure }) => {
    const [waiting, setWaiting] = useState(false);
    const desktopUnlock = useDesktopUnlock();

    const onUnlock = () =>
        desktopUnlock({
            onStart: () => setWaiting(true),
            onSuccess: () => {
                setWaiting(false);
                onSuccess?.();
            },
            onFailure: () => {
                setWaiting(false);
                onFailure?.();
            },
        });

    useAutoUnlock({ loading: waiting, onUnlock });

    return (
        <Button
            pill
            shape="solid"
            color="norm"
            className="w-full"
            loading={waiting}
            disabled={waiting}
            onClick={onUnlock}
        >
            <Icon name={isMac() ? 'fingerprint' : 'pass-lockmode-biometrics'} className="mr-1" />
            {c('Action').t`Unlock`}
        </Button>
    );
};
