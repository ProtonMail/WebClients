import type { VFC } from 'react';

import { ConfigProvider, Icons } from '@proton/components';
import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';

import * as config from '../../../../config';
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
