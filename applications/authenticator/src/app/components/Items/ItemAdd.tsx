import type { FC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import type { EntryDTO } from 'proton-authenticator/lib/entries/items';
import { validateItemForm } from 'proton-authenticator/lib/entries/validation';
import { addEntry } from 'proton-authenticator/store/entries';
import { useAppDispatch } from 'proton-authenticator/store/utils';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

import { ItemForm } from './ItemForm';

const FORM_ID = 'add-entry-form';

export const ItemAdd: FC<{ onClose: () => void }> = ({ onClose }) => {
    const dispatch = useAppDispatch();

    const form = useFormik<EntryDTO>({
        initialValues: {
            name: '',
            type: 'Totp',
            issuer: '',
            secret: '',
            period: 30,
            digits: 6,
            algorithm: 'SHA1',
            note: '',
        },
        onSubmit: async (values) => {
            void dispatch(addEntry(values));
            onClose();
        },
        validate: validateItemForm,
        validateOnChange: true,
    });

    return (
        <ModalTwo open onClose={onClose} onBackdropClick={onClose}>
            <ModalTwoHeader title={c('authenticator-2025:Title').t`New code`} />
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
