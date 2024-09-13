import { type FC, useCallback, useRef, useState } from 'react';
import { Provider as ReduxProvider, useStore } from 'react-redux';

import { Form, FormikProvider } from 'formik';
import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { useNotifications } from '@proton/components';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
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
import { itemsImportRequest } from '@proton/pass/store/actions/requests';
import type { MaybeNull } from '@proton/pass/types';
import { pipe, tap } from '@proton/pass/utils/fp/pipe';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { SettingsPanel } from './SettingsPanel';
import { getItemsText } from './helper';

export const Import: FC = () => {
    const store = useStore();
    const { endpoint } = usePassCore();
    const { createNotification } = useNotifications();
    const [importData, setImportData] = useState<MaybeNull<ImportPayload>>(null);
    const beforeSubmitResolver = useRef<(value: UseImportFormBeforeSubmitValue) => void>();

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
                key: itemsImportRequest(),
                showCloseButton: false,
                expiration: -1,
                text: (
                    <ReduxProvider store={store}>
                        <ImportProgress total={total} />
                    </ReduxProvider>
                ),
            });
        },
    });

    const showResultDetails = (result?.ignored.length ?? 0) > 0 || (result?.warnings?.length ?? 0) > 0;
    const totalImportedItems = result?.total ?? 0;
    const totalItems = totalImportedItems + (result?.ignored.length ?? 0);

    return (
        <>
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
                            <span>{getItemsText(totalItems)}</span>
                        </div>

                        <div>
                            <span className="color-weak">{c('Label').t`Total imported items : `}</span>
                            <span>{getItemsText(totalImportedItems)}</span>
                        </div>

                        {showResultDetails && (
                            <div className="bg-norm rounded-sm p-3 mt-2">
                                {result.ignored.length > 0 && (
                                    <span className="mb-2 block">
                                        {c('Info').ngettext(
                                            msgid`The following ${result.ignored.length} item could not be imported:`,
                                            `The following ${result.ignored.length} items could not be imported:`,
                                            result.ignored.length
                                        )}
                                    </span>
                                )}
                                <div className="color-weak overflow-auto" style={{ maxHeight: 150 }}>
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

                        {endpoint === 'page' && (
                            <div className="mt-2">
                                {c('Info')
                                    .t`To review your imported data, click on the Pass icon in your browser toolbar.`}
                            </div>
                        )}
                    </div>
                </SettingsPanel>
            )}

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
                        onClose={() => beforeSubmitResolver.current?.({ ok: false })}
                        payload={importData}
                        onSubmit={(payload) =>
                            beforeSubmitResolver?.current?.(
                                payload.vaults.length === 0 ? { ok: false } : { ok: true, payload }
                            )
                        }
                    />
                )}
            </SettingsPanel>
        </>
    );
};
