import { type VFC, useCallback, useRef, useState } from 'react';

import { Form, FormikProvider } from 'formik';
import { SettingsPanel } from 'proton-pass-extension/lib/components/Settings/SettingsPanel';
import { useExtensionConnectContext } from 'proton-pass-extension/lib/hooks/useExtensionConnectContext';
import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { useNotifications } from '@proton/components';
import { ImportForm } from '@proton/pass/components/Import/ImportForm';
import { ImportProgress } from '@proton/pass/components/Import/ImportProgress';
import { ImportVaultsPickerModal } from '@proton/pass/components/Import/ImportVaultsPickerModal';
import {
    type UseImportFormBeforeSubmit,
    type UseImportFormBeforeSubmitValue,
    useImportForm,
} from '@proton/pass/hooks/useImportForm';
import type { ImportPayload } from '@proton/pass/lib/import/types';
import { PROVIDER_INFO_MAP } from '@proton/pass/lib/import/types';
import * as requests from '@proton/pass/store/actions/requests';
import type { MaybeNull } from '@proton/pass/types';
import { pipe, tap } from '@proton/pass/utils/fp/pipe';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

export const Import: VFC = () => {
    const { createNotification } = useNotifications();
    const [importData, setImportData] = useState<MaybeNull<ImportPayload>>(null);
    const beforeSubmitResolver = useRef<(value: UseImportFormBeforeSubmitValue) => void>();
    const reset = () => beforeSubmitResolver.current?.({ ok: false });

    const { context } = useExtensionConnectContext();

    const beforeSubmit = useCallback<UseImportFormBeforeSubmit>(
        async (payload) =>
            new Promise((resolve) => {
                setImportData(payload);
                beforeSubmitResolver.current = pipe(
                    resolve,
                    tap(() => {
                        beforeSubmitResolver.current = undefined;
                        setImportData(null);
                    })
                );
            }),
        []
    );

    const { form, dropzone, busy, result } = useImportForm({
        beforeSubmit,
        onSubmit: (payload) => {
            const total = payload.vaults.reduce((count, vault) => count + vault.items.length, 0);
            createNotification({
                key: requests.importItems(),
                showCloseButton: false,
                expiration: -1,
                text: <ImportProgress total={total} port={context?.port} />,
            });
        },
    });

    const showResultDetails = (result?.ignored.length ?? 0) > 0 || (result?.warnings?.length ?? 0) > 0;
    const totalImportedItems = result?.total ?? 0;
    const totalItems = totalImportedItems + (result?.ignored.length ?? 0);

    return (
        <>
            <SettingsPanel
                title={c('Label').t`Import`}
                subTitle={c('Info')
                    .t`In order to migrate your data to ${PASS_APP_NAME} from another password manager, export your passwords and import them using the form below. Once all your items have been imported, delete the previously exported file.`}
            >
                <FormikProvider value={form}>
                    <Form className="modal-two-dialog-container">
                        <ImportForm form={form} dropzone={dropzone} busy={busy} />
                        {form.values.provider && (
                            <Button
                                className="mt-2"
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
                        onClose={reset}
                        payload={importData}
                        onSubmit={(payload) =>
                            beforeSubmitResolver?.current?.(
                                payload.vaults.length === 0 ? { ok: false } : { ok: true, payload }
                            )
                        }
                    />
                )}
            </SettingsPanel>

            {result && (
                <SettingsPanel title={c('Label').t`Latest import`}>
                    <div className="flex flex-column gap-y-1 text-sm">
                        <div>
                            <span className="color-weak">{c('Label').t`Imported from : `}</span>
                            <span className="rounded bg-primary px-1 user-select-none">
                                {PROVIDER_INFO_MAP[result.provider].title}
                            </span>
                        </div>

                        <div>
                            <span className="color-weak">{c('Label').t`Imported on : `}</span>
                            <span>{new Date(result.importedAt * 1000).toLocaleString()}</span>
                        </div>

                        <div>
                            <span className="color-weak">{c('Label').t`Total items : `}</span>
                            <span>
                                {c('Info').ngettext(msgid`${totalItems} item`, `${totalItems} items`, totalItems)}
                            </span>
                        </div>

                        <div>
                            <span className="color-weak">{c('Label').t`Total imported items : `}</span>
                            <span>
                                {c('Info').ngettext(
                                    msgid`${totalImportedItems} item`,
                                    `${totalImportedItems} items`,
                                    totalImportedItems
                                )}
                            </span>
                        </div>

                        {showResultDetails && (
                            <div className="bg-norm rounded-sm p-3 mt-2">
                                {result.ignored.length > 0 && (
                                    <span className="mb-2 block">
                                        {c('Info').ngettext(
                                            msgid`The following item could not be imported :`,
                                            `The following ${result.ignored.length} items could not be imported`,
                                            result.ignored.length
                                        )}
                                    </span>
                                )}
                                <div className="color-weak scroll-if-needed" style={{ maxHeight: 150 }}>
                                    {result.ignored.map((description, idx) => (
                                        <span className="block" key={`ignored-${idx}`}>
                                            {description}
                                        </span>
                                    ))}
                                    {result.warnings?.map((warning, idx) => (
                                        <span className="block" key={`warning-${idx}`}>
                                            {warning}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </SettingsPanel>
            )}
        </>
    );
};
