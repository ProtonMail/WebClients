import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import { Prompt } from '@proton/components';
import { useAssistant } from '@proton/llm/lib';
import { deleteAssistantCachedFiles } from '@proton/llm/lib/downloader';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';

const ClearBrowserDataModal = (rest: ModalProps) => {
    const { onClose } = rest;
    const { esDelete } = useEncryptedSearchContext();

    const { openedAssistants, closeAssistant, resetAssistantState } = useAssistant();
    const [userSettings] = useUserSettings();

    const handleClear = () => {
        if (isElectronMail) {
            void invokeInboxDesktopIPC({ type: 'clearAppData' });
            return;
        }

        void deleteAssistantCachedFiles().then(() => {
            if (userSettings.AIAssistantFlags === AI_ASSISTANT_ACCESS.CLIENT_ONLY) {
                for (const { id } of openedAssistants) {
                    closeAssistant(id, true);
                }
            }
            resetAssistantState();
        });
        void esDelete();
        onClose?.();
    };

    const title = c('Info').t`Clear browser data`;
    const description = c('Info')
        .t`Clearing browser data also deactivates message content search on this device. All messages will need to be downloaded again to search within them.`;

    return (
        <Prompt
            title={title}
            buttons={[
                <Button color="norm" onClick={handleClear}>{c('Info').t`Clear data`}</Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            {...rest}
        >
            {description}
        </Prompt>
    );
};

export default ClearBrowserDataModal;
