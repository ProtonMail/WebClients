import type { FC } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import { useAutoUnlock } from '@proton/pass/hooks/auth/useAutoUnlock';
import { useDesktopUnlock } from '@proton/pass/hooks/auth/useDesktopUnlock';
import { isMac } from '@proton/shared/lib/helpers/browser';

export const DesktopUnlock: FC = () => {
    const [loading, setLoading] = useState(false);
    const desktopUnlock = useDesktopUnlock();

    const onUnlock = async () => {
        try {
            setLoading(true);
            await desktopUnlock();
        } catch {
        } finally {
            setLoading(false);
        }
    };

    useAutoUnlock({ loading, onUnlock });

    return (
        <Button
            pill
            shape="solid"
            color="norm"
            className="w-full"
            loading={loading}
            disabled={loading}
            onClick={onUnlock}
        >
            <Icon name={isMac() ? 'fingerprint' : 'pass-lockmode-biometrics'} className="mr-1" />
            {c('Action').t`Unlock`}
        </Button>
    );
};
