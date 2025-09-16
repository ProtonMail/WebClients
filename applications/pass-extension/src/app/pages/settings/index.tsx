import { createRoot } from 'react-dom/client';

import { ExtensionRoot } from 'proton-pass-extension/lib/components/Extension/ExtensionRoot';
import { ExtensionSetup } from 'proton-pass-extension/lib/components/Extension/ExtensionSetup';

import { Settings } from './Settings';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
    <ExtensionRoot endpoint="page" wasm>
        <ExtensionSetup>
            <Settings />
        </ExtensionSetup>
    </ExtensionRoot>
);
