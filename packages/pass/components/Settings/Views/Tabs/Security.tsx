import type { FC } from 'react';

import { Clipboard } from '@proton/pass/components/Settings/Clipboard';
import { ContentProtection } from '@proton/pass/components/Settings/ContentProtection';
import { ExtraPassword } from '@proton/pass/components/Settings/ExtraPassword';
import { LockSettings } from '@proton/pass/components/Settings/LockSettings';

export const Security: FC = () => [
    <LockSettings key="lock" />,
    <ExtraPassword key="extra-pwd" />,
    ...(DESKTOP_BUILD ? [<Clipboard key="clipboard" />, <ContentProtection key="content-protection" />] : []),
];
