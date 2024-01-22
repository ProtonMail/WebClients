import type { FC } from 'react';

import { Icons } from '@proton/components';
import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';

import { IFrameContextProvider } from '../context/IFrameContextProvider';
import { DropdownContent } from './views/DropdownContent';

import './Dropdown.scss';

export const Dropdown: FC = () => (
    <IFrameContextProvider endpoint="dropdown">
        <Icons />
        <ThemeProvider />
        <DropdownContent />
    </IFrameContextProvider>
);
