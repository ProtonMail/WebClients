import type { FC, ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { SelectFieldProps } from '@proton/pass/components/Form/Field/SelectField';
import { VaultPicker } from '@proton/pass/components/Form/Field/VaultPickerField';
import type { ShareItem } from '@proton/pass/store/reducers';
import type { ShareType } from '@proton/pass/types/data/shares';
import noop from '@proton/utils/noop';

type Props = Omit<SelectFieldProps, 'children'> & { fallback: ReactNode };

export const AutosaveVaultPicker: FC<Props> = ({ fallback, ...props }) => {
    const [vaults, setVaults] = useState<ShareItem<ShareType.Vault>[]>([]);

    useEffect(() => {
        sendMessage
            .onSuccess(contentScriptMessage({ type: WorkerMessageType.VAULTS_QUERY }), (res) => {
                setVaults(res.vaults);
                void props.form.setFieldValue('shareId', res.defaultShareId);
            })
            .catch(noop);
    }, []);

    /** Only render the Vault picker in case there are 2 or more vaults
     * to select. Otherwise, render the required fallback node. */
    return vaults?.length > 1 ? (
        <VaultPicker vaults={vaults} availablePlacements={['bottom-start']} {...props} />
    ) : (
        fallback
    );
};
