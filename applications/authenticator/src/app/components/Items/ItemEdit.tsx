import type { FC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import type { Item } from 'proton-authenticator/lib/db/entities/items';
import type { EntryDTO } from 'proton-authenticator/lib/entries/items';
import { getAlgorithmFromUri, getDigitsFromUri } from 'proton-authenticator/lib/entries/items';
import { validateItemForm } from 'proton-authenticator/lib/entries/validation';
import { editEntry } from 'proton-authenticator/store/entries';
import { useAppDispatch } from 'proton-authenticator/store/utils';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';

import { ItemForm } from './ItemForm';

const FORM_ID = 'edit-entry-form';

type Props = { item: Item; onClose: () => void };

export const ItemEdit: FC<Props> = ({ item, onClose }) => {
    const dispatch = useAppDispatch();

    const form = useFormik<EntryDTO>({
        initialValues: {
            name: item.name,
            type: item.entryType,
            issuer: item.issuer,
            secret: item.secret,
            period: item.period,
            digits: getDigitsFromUri(item.uri) ?? 6,
            algorithm: getAlgorithmFromUri(item.uri) ?? 'SHA1',
            note: item.note,
        },
        onSubmit: async (values) => {
            void dispatch(editEntry({ ...values, id: item.id }));
            onClose();
        },
        validate: validateItemForm,
        validateOnChange: true,
    });

    return (
        <ModalTwo open onClose={onClose} onBackdropClick={onClose}>
            <ModalTwoHeader title={c('authenticator-2025:Title').t`Edit code`} />
            <ModalTwoContent>
                <FormikProvider value={form}>
                    <Form id={FORM_ID} className="flex flex-col">
                        <ItemForm form={form} />
                    </Form>
                </FormikProvider>
            </ModalTwoContent>
            <ModalTwoFooter>
                <div className="flex w-full justify-end">
                    <Button className="ml-auto cta-button" type="submit" color="norm" form={FORM_ID} pill>{c(
                        'authenticator-2025:Action'
                    ).t`Save code`}</Button>
                </div>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
