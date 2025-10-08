import { type FC, useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import { ProgressModal } from '@proton/pass/components/FileAttachments/ProgressModal';
import { ImportForm } from '@proton/pass/components/Import/ImportForm';
import { ImportVaultsPickerModal } from '@proton/pass/components/Import/ImportVaultsPickerModal';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { PasswordModal } from '@proton/pass/components/Lock/PasswordModal';
import type { OnPassphraseImportResult } from '@proton/pass/hooks/import/useImportForm';
import {
    type OnWillSubmitImport,
    type OnWillSubmitImportResult,
    useImportForm,
} from '@proton/pass/hooks/import/useImportForm';
import { useAsyncModalHandles } from '@proton/pass/hooks/useAsyncModalHandles';
import type { ImportPayload } from '@proton/pass/lib/import/types';
import { selectCanCreateItems } from '@proton/pass/store/selectors';
import type { MaybeNull } from '@proton/pass/types';
import { pipe, tap } from '@proton/pass/utils/fp/pipe';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { ImportReport } from './ImportReport';
import { SettingsPanel } from './SettingsPanel';

export const Import: FC = () => {
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
                <Icon name="info-circle-filled" size={5} className="shrink-0 mt-0.5" />
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
                    title={c('Title').t`Encrypted import`}
                    type="current-password"
                    open
                    loading={passphraseModal.state.loading}
                    onSubmit={(passphrase) => passphraseModal.resolver({ ok: true, passphrase })}
                    onClose={() => passphraseModal.resolver({ ok: false })}
                    submitLabel={c('Action').t`Confirm`}
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
                                disabled={busy || !form.isValid}
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
                        onClose={async () => willSubmitResolver.current?.({ ok: false })}
                        payload={importData}
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
