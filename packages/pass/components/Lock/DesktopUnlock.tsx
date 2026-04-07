import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import { useAutoDesktopUnlock } from '@proton/pass/hooks/auth/useDesktopUnlock';
import { isMac } from '@proton/shared/lib/helpers/browser';
import noop from '@proton/utils/noop';

export const DesktopUnlock: FC = () => {
    const { loading, onUnlock } = useAutoDesktopUnlock();

    return (
        <Button
            pill
            shape="solid"
            color="norm"
            className="w-full"
            loading={loading}
            disabled={loading}
            onClick={() => onUnlock().catch(noop)}
        >
            <Icon name={isMac() ? 'fingerprint' : 'pass-lockmode-biometrics'} className="mr-1" />
            {c('Action').t`Unlock`}
        </Button>
    );
};
