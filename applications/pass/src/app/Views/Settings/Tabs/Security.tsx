import { type FC } from 'react';

import { ClipboardSettings } from '@proton/pass/components/Settings/ClipboardSettings';
import { ExtraPassword } from '@proton/pass/components/Settings/ExtraPassword';
import { LockSettings } from '@proton/pass/components/Settings/LockSettings';

export const Security: FC = () => [
    <LockSettings key="lock" />,
    <ExtraPassword key="extra-pwd" />,
    ...(DESKTOP_BUILD ? [<ClipboardSettings key="clipboard" />] : []),
];
