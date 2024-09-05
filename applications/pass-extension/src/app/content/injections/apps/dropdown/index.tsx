import type { FC } from 'react';
import { createRoot } from 'react-dom/client';

import { IFrameApp } from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { ExtensionCore } from 'proton-pass-extension/lib/components/Extension/ExtensionCore';

import Icons from '@proton/icons/Icons';
import { ThemeProvider } from '@proton/pass/components/Layout/Theme/ThemeProvider';

import { Dropdown } from './Dropdown';

const App: FC = () => (
    <ExtensionCore endpoint="dropdown">
        <IFrameApp endpoint="dropdown">
            <Icons />
            <ThemeProvider />
            <Dropdown />
        </IFrameApp>
    </ExtensionCore>
);

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App />);
