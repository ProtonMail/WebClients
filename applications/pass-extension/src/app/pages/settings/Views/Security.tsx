import type { FC } from 'react';

import { usePermissions } from 'proton-pass-extension/lib/hooks/usePermissions';
import { CLIPBOARD_PERMISSIONS } from 'proton-pass-extension/lib/utils/permissions';

import { Clipboard } from '@proton/pass/components/Settings/Clipboard';
import { ExtraPassword } from '@proton/pass/components/Settings/ExtraPassword';
import { LockSettings } from '@proton/pass/components/Settings/LockSettings';

export const Security: FC = () => {
    const { enabled, request } = usePermissions(CLIPBOARD_PERMISSIONS);

    return [
        <LockSettings key="lock" />,
        <ExtraPassword key="extra-pwd" />,
        <Clipboard key="clipboard" disabled={!enabled} activate={request} />,
    ];
};
