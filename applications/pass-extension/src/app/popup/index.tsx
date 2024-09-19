import { createRoot } from 'react-dom/client';

import { ExtensionRoot } from 'proton-pass-extension/lib/components/Extension/ExtensionRoot';
import { ExtensionSetup } from 'proton-pass-extension/lib/components/Extension/ExtensionSetup';

import { Popup } from './Popup';

const container = document.querySelector('.app-root');
const root = createRoot(container!);

root.render(
    <ExtensionRoot endpoint="popup">
        <ExtensionSetup>
            <Popup />
        </ExtensionSetup>
    </ExtensionRoot>
);
