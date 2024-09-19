import { createRoot } from 'react-dom/client';

import { IFrameApp } from 'proton-pass-extension/app/content/injections/apps/components/IFrameApp';
import { ExtensionRoot } from 'proton-pass-extension/lib/components/Extension/ExtensionRoot';

import { Notification } from './Notification';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
    <ExtensionRoot endpoint="notification">
        <IFrameApp>
            <Notification />
        </IFrameApp>
    </ExtensionRoot>
);
