import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalProps, Prompt } from '@proton/components';
import { invokeInboxDesktopIPC } from '@proton/shared/lib/desktop/ipcHelpers';
import { isElectronMail } from '@proton/shared/lib/helpers/desktop';

import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';

const ClearBrowserDataModal = (rest: ModalProps) => {
    const { onClose } = rest;
    const { esDelete } = useEncryptedSearchContext();

    const handleClear = () => {
        if (isElectronMail) {
            invokeInboxDesktopIPC({ type: 'clearAppData' });
        } else {
            void esDelete();
            onClose?.();
        }
    };

    const title = isElectronMail ? c('Info').t`Clear app data` : c('Info').t`Disable message content search`;
    const description = isElectronMail
        ? c('Info')
              .t`This removes all data associated with this app, including downloaded messages. The app will restart and you will need to sign in again to use the app.`
        : c('Info')
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
