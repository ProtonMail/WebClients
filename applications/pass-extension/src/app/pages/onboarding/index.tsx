import { createRoot } from 'react-dom/client';

import { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';

import { ExtensionRoot } from '../../../lib/components/Extension/ExtensionRoot';
import { ExtensionSetup } from '../../../lib/components/Extension/ExtensionSetup';
import { Onboarding } from './Onboarding';

const container = document.getElementById('root');
const root = createRoot(container!);

/** Web accessible for the account app links: never render framed, to prevent clickjacking */
const isFramed = window.top !== window;

if (!isFramed) {
    root.render(
        <ExtensionRoot endpoint="page" theme={PassThemeOption.PassDark} wasm>
            <ExtensionSetup>
                <Onboarding />
            </ExtensionSetup>
        </ExtensionRoot>
    );
}
