import { createRoot } from 'react-dom/client';

import { ExtensionRoot } from 'proton-pass-extension/lib/components/Extension/ExtensionRoot';
import { IFrameApp } from 'proton-pass-extension/lib/components/Inline/IFrameApp';

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
