import { type FC, useState } from 'react';

import { c } from 'ttag';

import type { MaybeNull } from '@proton/pass/types';

import type { ImportProvider, ImportResultDTO } from '../../../../lib/importers/types';
import { importBackup } from '../../../../store/backup';
import { useAppDispatch } from '../../../../store/utils';
import { PasswordModal } from '../Locks/PasswordModal';
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
