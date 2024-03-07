import type { FC } from 'react';

import { IFrameContextProvider } from 'proton-pass-extension/app/content/injections/apps/context/IFrameContextProvider';
import { ExtensionCore } from 'proton-pass-extension/lib/components/Extension/ExtensionCore';

import { Icons } from '@proton/components';
import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';

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
