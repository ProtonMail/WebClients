import type { FC, ReactNode } from 'react';
import { useEffect, useState } from 'react';

import type { SelectFieldProps } from '@proton/pass/components/Form/Field/SelectField';
import { VaultFolderPickerFieldCore } from '@proton/pass/components/Form/Field/VaultFolderPickerFieldCore';
import type { FoldersByShareId, ShareItem } from '@proton/pass/store/reducers';
import type { ShareType } from '@proton/pass/types';
import noop from '@proton/utils/noop';

import { WorkerMessageType } from '../../../types/messages';
import { contentScriptMessage, sendMessage } from '../../message/send-message';

type Props = Omit<SelectFieldProps, 'children'> & { fallback: ReactNode; attempt?: number };

export const AutosaveVaultPicker: FC<Props> = ({ fallback, attempt, ...props }) => {
    const [vaults, setVaults] = useState<ShareItem<ShareType.Vault>[]>([]);
    const [folders, setFolders] = useState<FoldersByShareId>({});
    const [canUseFolders, setCanUseFolders] = useState(false);

    useEffect(
        () => {
            sendMessage
                .onSuccess(contentScriptMessage({ type: WorkerMessageType.VAULTS_QUERY }), (res) => {
                    setVaults(res.vaults);
                    setFolders(res.folders);
                    setCanUseFolders(res.canUseFolders);
                    void props.form.setFieldValue('shareId', res.defaultShareId);
                })
                .catch(noop);
        },

        /** Refresh vault picker options on each
         * failed attempt in case vault deleted */
        [attempt]
    );

    const hasFolders = vaults.some((vault) => Object.keys(folders[vault.shareId] ?? {}).length > 0);

    /** Only render the picker when there are multiple vaults or 1 vault with folder(s) */
    return vaults.length > 1 || (hasFolders && canUseFolders) ? (
        <VaultFolderPickerFieldCore
            vaults={vaults}
            folders={folders}
            showFolders={canUseFolders}
            shareId={props.form.values.shareId}
            folderId={props.form.values.folderId ?? null}
            onChange={(shareId, folderId) => {
                void props.form.setFieldValue('shareId', shareId);
                void props.form.setFieldValue('folderId', folderId);
            }}
        />
    ) : (
        fallback
    );
};
