import { createRoot } from 'react-dom/client';

import { ExtensionRoot } from '../../../lib/components/Extension/ExtensionRoot';
import { ExtensionSetup } from '../../../lib/components/Extension/ExtensionSetup';
import { Internal } from './Internal';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
    <ExtensionRoot endpoint="page" wasm>
        <ExtensionSetup>
            <Internal />
        </ExtensionSetup>
    </ExtensionRoot>
);
