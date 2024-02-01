import type { FC } from 'react';

import { ExtensionCore } from 'proton-pass-extension/lib/components/Extension/ExtensionCore';

import { Icons } from '@proton/components';
import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';

import { IFrameContextProvider } from '../context/IFrameContextProvider';
import { DropdownContent } from './views/DropdownContent';

import './Dropdown.scss';

export const Dropdown: FC = () => (
    <ExtensionCore endpoint="dropdown">
        <IFrameContextProvider endpoint="dropdown">
            <Icons />
            <ThemeProvider />
            <DropdownContent />
        </IFrameContextProvider>
    </ExtensionCore>
);
