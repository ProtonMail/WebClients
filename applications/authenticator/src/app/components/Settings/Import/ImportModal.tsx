import { type FC, useState } from 'react';

import { PasswordModal } from 'proton-authenticator/app/components/Settings/Locks/PasswordModal';
import type { ImportProvider, ImportResultDTO } from 'proton-authenticator/lib/importers/types';
import { importBackup } from 'proton-authenticator/store/backup';
import { useAppDispatch } from 'proton-authenticator/store/utils';
import { c } from 'ttag';

import type { MaybeNull } from '@proton/pass/types';

import { ImportInstructionsModal } from './ImportInstructionsModal';

type ImportModalProps = {
    onClose: () => void;
    provider: ImportProvider;
};

export const ImportModal: FC<ImportModalProps> = ({ onClose, provider }) => {
    const dispatch = useAppDispatch();
    const [importResult, setImportResult] = useState<MaybeNull<ImportResultDTO>>(null);

    const onImport = async (provider: ImportProvider) => {
        const payload = await dispatch(importBackup({ provider })).unwrap();
        if (payload?.passwordRequired) setImportResult(payload);
        else onClose();
    };

    return importResult?.passwordRequired ? (
        <PasswordModal
            onSubmit={async (password) => {
                await dispatch(importBackup({ provider, password, path: importResult.path }));
                onClose();
            }}
            title={c('authenticator-2025:Title').t`Protected file`}
            message={
                <div className="color-weak">
                    {c('authenticator-2025:Description')
                        .t`Your import file is protected by a password. Please enter the password to proceed.`}
                </div>
            }
            submitLabel={c('authenticator-2025:Action').t`Import`}
            onClose={onClose}
            open
        />
    ) : (
        <ImportInstructionsModal provider={provider} onImport={onImport} onClose={onClose} />
    );
};
