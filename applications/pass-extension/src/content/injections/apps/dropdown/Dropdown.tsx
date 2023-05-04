import type { VFC } from 'react';

import { ConfigProvider, Icons } from '@proton/components';

import * as config from '../../../../app/config';
import { ThemeProvider } from '../../../../shared/theme/ThemeProvider';
import { IFrameContextProvider } from '../context/IFrameContextProvider';
import { DropdownContent } from './views/DropdownContent';

import './Dropdown.scss';

export const Dropdown: VFC = () => (
    <IFrameContextProvider endpoint="dropdown">
        <ConfigProvider config={config}>
            <Icons />
            <ThemeProvider />
            <DropdownContent />
        </ConfigProvider>
    </IFrameContextProvider>
);
