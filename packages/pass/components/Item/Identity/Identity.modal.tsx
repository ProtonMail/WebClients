import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { Form, FormikProvider, useFormik } from 'formik';
import type { FormikHelpers } from 'formik/dist/types';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, useModalState } from '@proton/components';
import { Field } from '@proton/pass/components/Form/Field/Field';
import { FieldsetCluster } from '@proton/pass/components/Form/Field/Layout/FieldsetCluster';
import { TextField } from '@proton/pass/components/Form/Field/TextField';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { UpsellRef } from '@proton/pass/constants';
import { validateIdentitySection } from '@proton/pass/lib/validation/identity';
import { selectPassPlan } from '@proton/pass/store/selectors';
import type { IdentitySectionFormValues } from '@proton/pass/types';
import { UserPassPlan } from '@proton/pass/types/api/plan';

const formId = 'identity-new-section-modal';

type Props = { onAdd: (v: string) => void };

export const IdentityAddNewSection: FC<Props> = ({ onAdd }) => {
    const [{ open, onClose }, setModal] = useModalState();
    const isFreePlan = useSelector(selectPassPlan) === UserPassPlan.FREE;
    const spotlight = useSpotlight();

    const closeModal = (resetForm: FormikHelpers<IdentitySectionFormValues>['resetForm']) => {
        resetForm();
        onClose();
    };

    const form = useFormik<IdentitySectionFormValues>({
        initialValues: { sectionName: '' },
        onSubmit: ({ sectionName }, { resetForm }) => {
            onAdd(sectionName);
            closeModal(resetForm);
        },
        validate: validateIdentitySection,
        validateOnBlur: true,
    });

    return (
        <>
            <Button
                className="rounded-full w-full mb-1"
                color="weak"
                shape="solid"
                onClick={() =>
                    isFreePlan
                        ? spotlight.setUpselling({ type: 'pass-plus', upsellRef: UpsellRef.IDENTITY_CUSTOM_FIELDS })
                        : setModal(true)
                }
            >
                <div className="flex items-center justify-center">
                    <Icon name="plus" />
                    <div className="ml-2 text-semibold">{c('Label').t`Add section`}</div>
                </div>
            </Button>
            <PassModal size="small" open={open} enableCloseWhenClickOutside onClose={() => closeModal(form.resetForm)}>
                <ModalTwoHeader title={c('Action').t`Custom section`} />
                <FormikProvider value={form}>
                    <Form id={formId}>
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
                        form={formId}
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
