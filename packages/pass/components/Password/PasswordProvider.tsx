import type { FC, PropsWithChildren } from 'react';

import { PasswordGeneratorAction } from './PasswordGeneratorAction';
import { PasswordHistoryActions } from './PasswordHistoryActions';

export const PasswordProvider: FC<PropsWithChildren> = ({ children }) => (
    <PasswordHistoryActions>
        <PasswordGeneratorAction>{children}</PasswordGeneratorAction>
    </PasswordHistoryActions>
);
