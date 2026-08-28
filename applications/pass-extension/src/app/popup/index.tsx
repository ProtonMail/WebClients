import { createRoot } from 'react-dom/client';

import { ExtensionRoot } from '../../lib/components/Extension/ExtensionRoot';
import { ExtensionSetup } from '../../lib/components/Extension/ExtensionSetup';
import { Popup } from './Popup';

const container = document.querySelector('.app-root');
const root = createRoot(container!);

root.render(
    <ExtensionRoot endpoint="popup" wasm>
        <ExtensionSetup>
            <Popup />
        </ExtensionSetup>
    </ExtensionRoot>
);
