import { type FC } from 'react';

import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Checkbox, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import type { ConfirmationModalProps } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { useSpotlightFor } from '@proton/pass/components/Spotlight/WithSpotlight';
import { SpotlightMessage } from '@proton/pass/types';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

type ConfirmAutotypeValues = { dontShowAgain: boolean };
type Props = { onConfirm: () => void } & Pick<ConfirmationModalProps, 'onClose'>;

const FORM_ID = 'autotype-confirm-click';
const initialValues: ConfirmAutotypeValues = { dontShowAgain: true };

export const ConfirmAutotype: FC<Props> = ({ onConfirm, onClose }) => {
    const autotypeConfirmSpotlight = useSpotlightFor(SpotlightMessage.AUTOTYPE_CONFIRM);

    const form = useFormik<ConfirmAutotypeValues>({
        initialValues,
        onSubmit: ({ dontShowAgain }) => {
            if (dontShowAgain) autotypeConfirmSpotlight.acknowledge();
            void onConfirm();
        },
    });

    return (
        <PassModal onClose={onClose} open size="medium">
            <ModalTwoHeader title={c('Title').t`Perform autotype?`} />
            <ModalTwoContent>
                <div className="mb-2">{c('Info')
                    .t`Please make sure the previously active window is where you want to autotype and your cursor was focused on the login field.`}</div>
                <div className="text-sm color-weak mb-4">{c('Info')
                    .t`Depending on your operating system, you may need to grant accessiblity permission to ${PASS_APP_NAME}`}</div>
                <FormikProvider value={form}>
                    <Form id={FORM_ID}>
                        <Checkbox
                            className="pass-checkbox--unset gap-0 mb-2"
                            checked={form.values.dontShowAgain}
                            onChange={({ target }) => form.setFieldValue('dontShowAgain', target.checked)}
                        >
                            {c('Action').t`Do not show again`}
                        </Checkbox>
                    </Form>
                </FormikProvider>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={onClose} color="norm" shape="outline" pill>
                    {c('Action').t`Cancel`}
                </Button>
                <Button type="submit" color="norm" form={FORM_ID} pill>
                    {c('Action').t`Confirm`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
