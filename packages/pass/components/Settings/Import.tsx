import { type FC, useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcInfoCircleFilled } from '@proton/icons/icons/IcInfoCircleFilled';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import type { OnPassphraseImportResult } from '../../hooks/import/useImportForm';
import {
    type OnWillSubmitImport,
    type OnWillSubmitImportResult,
    useImportForm,
} from '../../hooks/import/useImportForm';
import { useAsyncModalHandles } from '../../hooks/useAsyncModalHandles';
import type { ImportPayload } from '../../lib/import/types';
import { selectCanCreateItems } from '../../store/selectors';
import type { MaybeNull } from '../../types';
import { pipe, tap } from '../../utils/fp/pipe';
import { deobfuscate } from '../../utils/obfuscate/xor';
import { useOffline } from '../Core/ConnectivityProvider';
import { ProgressModal } from '../FileAttachments/ProgressModal';
import { ImportForm } from '../Import/ImportForm';
import { ImportVaultsPickerModal } from '../Import/ImportVaultsPickerModal';
import { Card } from '../Layout/Card/Card';
import { PasswordModal } from '../Lock/PasswordModal';
import { ImportReport } from './ImportReport';
import { SettingsPanel } from './SettingsPanel';

export const Import: FC = () => {
    const offline = useOffline();

    const [importData, setImportData] = useState<MaybeNull<ImportPayload>>(null);
    const willSubmitResolver = useRef<(value: OnWillSubmitImportResult) => void>();
    const passphraseModal = useAsyncModalHandles<OnPassphraseImportResult>({ getInitialModalState: () => ({}) });

    const onWillSubmit = useCallback<OnWillSubmitImport>(
        async (payload) =>
            new Promise((resolve) => {
                setImportData(payload);
                willSubmitResolver.current = pipe(
                    resolve,
                    tap(() => {
                        willSubmitResolver.current = undefined;
                        setImportData(null);
                    })
                );
            }),
        []
    );

    const { form, dropzone, busy, progress, cancel } = useImportForm({
        onWillSubmit,
        onPassphrase: () =>
            new Promise((onSubmit) => passphraseModal.handler({ onSubmit }).catch(() => ({ ok: false }))),
    });

    const canCreateItem = useSelector(selectCanCreateItems);

    if (!canCreateItem) {
        return (
            <Card className="flex items-center flex-nowrap w-full gap-3" type="primary">
                <IcInfoCircleFilled size={5} className="shrink-0 mt-0.5" />
                <span>{c('Info').t`You need a vault with edit permission before you can import items.`}</span>
            </Card>
        );
    }

    return (
        <>
            {progress !== null && (
                <ProgressModal
                    progress={progress}
                    title={c('Title').t`Importing your data`}
                    message={c('Info')
                        .t`Please keep this window open while your data is being imported. This process may take a few minutes.`}
                    onCancel={cancel}
                />
            )}

            {passphraseModal.state.open && (
                <PasswordModal
                    loading={passphraseModal.state.loading}
                    open
                    submitLabel={c('Action').t`Confirm`}
                    title={c('Title').t`Encrypted import`}
                    type="current-password"
                    onClose={() => passphraseModal.resolver({ ok: false })}
                    onSubmit={(passphrase) =>
                        passphraseModal.resolver({
                            ok: true,
                            passphrase: deobfuscate(passphrase, { zeroize: true }),
                        })
                    }
                />
            )}

            <ImportReport />

            <SettingsPanel
                title={c('Label').t`Import`}
                subTitle={c('Info')
                    .t`To migrate data from another password manager, go to the password manager, export your data, then upload it to ${PASS_APP_NAME}. Once your data has been imported, delete the exported file.`}
            >
                <FormikProvider value={form}>
                    <Form>
                        <ImportForm form={form} dropzone={dropzone} busy={busy} />
                        {form.values.provider && (
                            <Button
                                className="w-full mt-2"
                                type="submit"
                                disabled={offline || busy || !form.isValid}
                                loading={busy}
                                color="norm"
                            >
                                {busy ? c('Action').t`Importing` : c('Action').t`Import`}
                            </Button>
                        )}
                    </Form>
                </FormikProvider>

                {importData !== null && (
                    <ImportVaultsPickerModal
                        disabled={offline}
                        payload={importData}
                        onClose={() => willSubmitResolver.current?.({ ok: false })}
                        onSubmit={(payload) =>
                            willSubmitResolver?.current?.(
                                payload.vaults.length === 0 ? { ok: false } : { ok: true, payload }
                            )
                        }
                    />
                )}
            </SettingsPanel>
        </>
    );
};
