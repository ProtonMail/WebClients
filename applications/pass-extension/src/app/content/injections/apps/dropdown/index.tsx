import { createRoot } from 'react-dom/client';

import { IFrameApp } from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { ExtensionRoot } from 'proton-pass-extension/lib/components/Extension/ExtensionRoot';

import { Dropdown } from './Dropdown';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
    <ExtensionRoot endpoint="dropdown">
        <IFrameApp>
            <Dropdown />
        </IFrameApp>
    </ExtensionRoot>
);
