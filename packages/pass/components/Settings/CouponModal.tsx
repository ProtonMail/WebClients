import type { FC } from 'react';

import type { FormikErrors } from 'formik';
import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';

import { useRequest } from '../../hooks/useRequest';
import { redeemCoupon } from '../../store/actions';
import { Field } from '../Form/Field/Field';
import { FieldsetCluster } from '../Form/Field/Layout/FieldsetCluster';
import { TextField } from '../Form/Field/TextField';
import { PassModal } from '../Layout/Modal/PassModal';

const FORM_ID = 'coupon-redeem';
type Props = { onClose: () => void };
type FormValues = { coupon: string };

export const CouponModal: FC<Props> = ({ onClose }) => {
    const { loading, dispatch } = useRequest(redeemCoupon, {
        onSuccess: onClose,
    });

    const form = useFormik<FormValues>({
        initialValues: { coupon: '' },
        validateOnChange: true,
        validateOnMount: false,
        validate: ({ coupon }) => {
            const errors: FormikErrors<FormValues> = {};
            if (!coupon) errors.coupon = c('Warning').t`Coupon cannot be empty`;
            return errors;
        },
        onSubmit: ({ coupon }) => dispatch(coupon),
    });

    return (
        <PassModal open onClose={onClose} enableCloseWhenClickOutside>
            <ModalTwoHeader title={c('Title').t`Enter coupon code`} />
            <ModalTwoContent>
                <FormikProvider value={form}>
                    <Form id={FORM_ID} className="mb-4">
                        <FieldsetCluster>
                            <Field
                                name="coupon"
                                component={TextField}
                                placeholder={c('Placeholder').t`Coupon`}
                                autoFocus
                            />
                        </FieldsetCluster>
                    </Form>
                </FormikProvider>
            </ModalTwoContent>

            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button
                    size="large"
                    shape="solid"
                    color="norm"
                    loading={loading}
                    disabled={!form.isValid}
                    type="submit"
                    form={FORM_ID}
                >
                    {c('Action').t`Confirm`}
                </Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
