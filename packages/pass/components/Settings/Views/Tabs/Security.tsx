import type { FC } from 'react';

import { Clipboard } from '../../Clipboard';
import { ContentProtection } from '../../ContentProtection';
import { ExtraPassword } from '../../ExtraPassword';
import { LockSettings } from '../../LockSettings';

export const Security: FC = () => [
    <LockSettings key="lock" />,
    <ExtraPassword key="extra-pwd" />,
    ...(DESKTOP_BUILD ? [<Clipboard key="clipboard" />, <ContentProtection key="content-protection" />] : []),
];
