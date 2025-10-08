import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import type { FormikHelpers } from 'formik/dist/types';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Icon from '@proton/components/components/icon/Icon';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import type { UpsellRef } from '@proton/pass/constants';
import { validateCustomSectionName } from '@proton/pass/lib/validation/custom-item';
import { selectPassPlan } from '@proton/pass/store/selectors';
import type { ItemSectionFormValues } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';

const FORM_ID = 'new-section-modal';
/** : UpsellRef.IDENTITY_CUSTOM_FIELDS */

type Props = { onAdd: (value: string) => void; upsellRef: UpsellRef };

export const CustomNewSection: FC<Props> = ({ onAdd, upsellRef }) => {
    const [{ open, onClose }, setModal] = useModalState();
    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;
    const upsell = useUpselling();

    const closeModal = (resetForm: FormikHelpers<ItemSectionFormValues>['resetForm']) => {
        resetForm();
        onClose();
    };

    const form = useFormik<ItemSectionFormValues>({
        initialValues: { sectionName: '' },
        onSubmit: ({ sectionName }, { resetForm }) => {
            onAdd(sectionName);
            closeModal(resetForm);
        },
        validate: validateCustomSectionName,
        validateOnBlur: true,
    });

    return (
        <>
            <Button
                className="rounded-full w-full mb-1"
                color="weak"
                shape="solid"
                onClick={() => (isFreePlan ? upsell({ type: 'pass-plus', upsellRef }) : setModal(true))}
            >
                <div className="flex items-center justify-center">
                    <Icon name="plus" />
                    <div className="ml-2 text-semibold">{c('Label').t`Add section`}</div>
                </div>
            </Button>
            <PassModal size="small" open={open} enableCloseWhenClickOutside onClose={() => closeModal(form.resetForm)}>
                <ModalTwoHeader title={c('Action').t`Custom section`} />
                <FormikProvider value={form}>
                    <Form id={FORM_ID}>
                        <ModalTwoContent>
                            <FieldsetCluster>
                                <Field
                                    component={TextField}
                                    label={c('Action').t`Section name`}
                                    error={form.errors.sectionName}
                                    name="sectionName"
                                    type="text"
                                    autoFocus
                                    unstyled
                                />
                            </FieldsetCluster>
                        </ModalTwoContent>
                    </Form>
                </FormikProvider>
                <ModalTwoFooter>
                    <Button
                        className="rounded-full w-full"
                        form={FORM_ID}
                        disabled={!form.isValid}
                        color="weak"
                        shape="solid"
                        pill
                        type="submit"
                    >
                        <span className="text-ellipsis">{c('Action').t`Add section`}</span>
                    </Button>
                </ModalTwoFooter>
            </PassModal>
        </>
    );
};
