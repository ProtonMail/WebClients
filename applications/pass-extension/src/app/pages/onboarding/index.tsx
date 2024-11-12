import { createRoot } from 'react-dom/client';

import { ExtensionRoot } from 'proton-pass-extension/lib/components/Extension/ExtensionRoot';
import { ExtensionSetup } from 'proton-pass-extension/lib/components/Extension/ExtensionSetup';

import { PassThemeOption } from '@proton/pass/components/Layout/Theme/types';
import '@proton/pass/styles/common.scss';

import { Onboarding } from './Onboarding';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
    <ExtensionRoot endpoint="page" theme={PassThemeOption.PassDark}>
        <ExtensionSetup>
            <Onboarding />
        </ExtensionSetup>
    </ExtensionRoot>
);
