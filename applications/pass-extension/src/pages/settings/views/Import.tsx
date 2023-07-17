import { type VFC, useCallback, useRef, useState } from 'react';

import { Form, FormikProvider } from 'formik';
import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import { useNotifications } from '@proton/components';
import type { ImportPayload } from '@proton/pass/import';
import { PROVIDER_INFO_MAP } from '@proton/pass/import';
import * as requests from '@proton/pass/store/actions/requests';
import type { MaybeNull } from '@proton/pass/types';
import { pipe, tap } from '@proton/pass/utils/fp';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { ImportForm, ImportVaultsPickerModal } from '../../../shared/components/import';
import { ImportProgress } from '../../../shared/components/import/ImportProgress';
import {
    type UseImportFormBeforeSubmit,
    type UseImportFormBeforeSubmitValue,
    useExtensionContext,
    useImportForm,
} from '../../../shared/hooks';

export const Import: VFC = () => {
    const { createNotification } = useNotifications();
    const [importData, setImportData] = useState<MaybeNull<ImportPayload>>(null);
    const beforeSubmitResolver = useRef<(value: UseImportFormBeforeSubmitValue) => void>();
    const reset = () => beforeSubmitResolver.current?.({ ok: false });

    const { context } = useExtensionContext();

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
            <Card rounded className="mb-4 p-3 relative">
                <strong className="color-norm block mb-1">{c('Label').t`Import`}</strong>
                <em className="block text-sm color-weak mb-2">
                    {c('Info')
                        .t`In order to migrate your data to ${PASS_APP_NAME} from another password manager, export your passwords and import them using the form below. Once all your items have been imported, delete the previously exported file.`}
                </em>

                <hr className="mt-2 mb-4 border-weak" />

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
            </Card>

            {result && (
                <Card rounded className="mt-4 p-3">
                    <strong className="color-weak block">{c('Label').t`Latest import`}</strong>
                    <hr className="mt-2 mb-4 border-weak" />
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
                </Card>
            )}
        </>
    );
};
