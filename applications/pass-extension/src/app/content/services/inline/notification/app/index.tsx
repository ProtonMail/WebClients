import { createRoot } from 'react-dom/client';

import { ExtensionRoot } from 'proton-pass-extension/lib/components/Extension/ExtensionRoot';
import { IFrameApp } from 'proton-pass-extension/lib/components/Inline/IFrameApp';

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
