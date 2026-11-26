import { createRoot } from 'react-dom/client';

import { ExtensionRoot } from '../../../../../../lib/components/Extension/ExtensionRoot';
import { IFrameApp } from '../../../../../../lib/components/Inline/IFrameApp';
import { Toast } from './Toast';

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
    <ExtensionRoot endpoint="toast">
        <IFrameApp>
            <Toast />
        </IFrameApp>
    </ExtensionRoot>
);
