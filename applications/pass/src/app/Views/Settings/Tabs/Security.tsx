import type { FC } from 'react';

import { Clipboard } from '@proton/pass/components/Settings/Clipboard';
import { ExtraPassword } from '@proton/pass/components/Settings/ExtraPassword';
import { LockSettings } from '@proton/pass/components/Settings/LockSettings';

export const Security: FC = () => [
    <LockSettings key="lock" />,
    <ExtraPassword key="extra-pwd" />,
    <Clipboard key="clipboard" />,
];
