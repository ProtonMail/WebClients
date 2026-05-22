import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext, useState } from 'react';

import { c } from 'ttag';

import { ConfirmationPrompt } from '@proton/pass/components/Confirmation/ConfirmationPrompt';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

const NativeMessagingPermissionPromptContext = createContext(() => {});

export const useNativeMessagingPermissionPrompt = () => useContext(NativeMessagingPermissionPromptContext);

export const NativeMessagingPromptProvider: FC<PropsWithChildren> = ({ children }) => {
    const { requestNativeMessagingPermission } = usePassCore();
    const [open, setOpen] = useState(false);

    const prompt = () => setOpen(true);

    return (
        <NativeMessagingPermissionPromptContext.Provider value={prompt}>
            {children}
            {open && (
                <ConfirmationPrompt
                    title={c('Title').t`Browser permission required`}
                    confirmText={c('Action').t`Continue`}
                    message={c('Info')
                        .t`To set up biometrics unlock, ${PASS_APP_NAME} requires a new browser permission. After you accept it, the extension will reload. Please re-open this page afterwards.`}
                    onCancel={() => setOpen(false)}
                    onConfirm={() => {
                        setOpen(false);
                        void requestNativeMessagingPermission?.();
                    }}
                />
            )}
        </NativeMessagingPermissionPromptContext.Provider>
    );
};
