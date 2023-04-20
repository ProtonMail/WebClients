import { type VFC, useCallback, useRef, useState } from 'react';

import { Form, FormikProvider } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import type { ImportPayload } from '@proton/pass/import';
import type { MaybeNull } from '@proton/pass/types';
import { pipe, tap } from '@proton/pass/utils/fp';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { ImportForm, ImportVaultsPicker, type ImportVaultsPickerHandle } from '../../../shared/components/import';
import {
    type UseImportFormBeforeSubmit,
    type UseImportFormBeforeSubmitValue,
    useImportForm,
} from '../../../shared/hooks';

export const Import: VFC = () => {
    const [importData, setImportData] = useState<MaybeNull<ImportPayload>>(null);
    const vaultPickerRef = useRef<ImportVaultsPickerHandle>(null);
    const beforeSubmitResolver = useRef<(value: UseImportFormBeforeSubmitValue) => void>();
    const reset = () => beforeSubmitResolver.current?.({ ok: false });

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

    const { form, dropzone, busy } = useImportForm({ beforeSubmit });

    return (
        <Card rounded className="mb-4 p-3 relative">
            <strong className="color-norm block">{c('Label').t`Import`}</strong>
            <em className="block text-sm color-weak mt-1">
                {c('Info')
                    .t`In order to migrate your data to ${PASS_APP_NAME} from another password manager, export your passwords from your current provider and import them using the form below. Once all your items have been imported, delete the previously exported file.`}
            </em>

            <hr className="mt-2 mb-4 border-weak" />

            <FormikProvider value={form}>
                <Form className="modal-two-dialog-container">
                    <ImportForm form={form} dropzone={dropzone} busy={busy} />
                    <Button className="mt-3" type="submit" disabled={busy || !form.isValid} loading={busy} color="norm">
                        {busy ? c('Action').t`Importing` : c('Action').t`Import`}
                    </Button>
                </Form>
            </FormikProvider>

            {importData && (
                <ModalTwo onClose={reset} onReset={reset} open size={'medium'} className="mt-10">
                    <ModalTwoHeader title={c('Title').t`Import to vaults`} />
                    <ModalTwoContent>
                        <ImportVaultsPicker
                            ref={vaultPickerRef}
                            payload={importData}
                            onSubmit={(payload) =>
                                beforeSubmitResolver?.current?.(
                                    payload.length === 0 ? { ok: false } : { ok: true, payload }
                                )
                            }
                        />
                    </ModalTwoContent>
                    <ModalTwoFooter>
                        <Button type="reset" onClick={reset} color="danger">
                            {c('Action').t`Cancel`}
                        </Button>
                        <Button type="button" color="norm" onClick={() => vaultPickerRef.current?.submit()}>{c('Action')
                            .t`Proceed`}</Button>
                    </ModalTwoFooter>
                </ModalTwo>
            )}
        </Card>
    );
};
