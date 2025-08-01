import { Form, type FormikErrors, FormikProvider, useFormik } from 'formik';
import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { type ModalStateProps, useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import Prompt from '@proton/components/components/prompt/Prompt';
import InputFieldTwo from '@proton/components/components/v2/field/InputField';
import TextAreaTwo from '@proton/components/components/v2/input/TextArea';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import {
    type RetentionRule,
    RetentionRuleAction,
    RetentionRuleProduct,
} from '@proton/shared/lib/interfaces/RetentionRule';
import isTruthy from '@proton/utils/isTruthy';

import ProductSelection from './ProductSelection';
import RetentionDurationSetting from './RetentionDurationSetting';
import RetentionScopes from './RetentionScopes';
import { convertToRetentionRuleFormData } from './helpers';
import type { RetentionRuleFormData, RetentionRuleScopeFormData } from './types';
import type { RetentionPoliciesManagementReturn } from './useRetentionPoliciesManagement';
import { useRetentionRuleScopeSuggestion } from './useRetentionRuleScopeSuggestion';

interface Props {
    retentionRule: RetentionRule | null;
    retentionPoliciesManagement: RetentionPoliciesManagementReturn;
    onSuccess?: () => void;
}

const FORM_ID = 'retention-policy';
const MIN_LIFETIME = 30;
const INITIAL_FORM_VALUES: RetentionRuleFormData = {
    id: null,
    name: '',
    products: RetentionRuleProduct.Mail,
    lifetime: null,
    action: RetentionRuleAction.RetainAll,
    scopes: [],
};

export const getRuleNamePlaceholder = (product: RetentionRuleProduct) => {
    if (product === RetentionRuleProduct.Mail) {
        return c('retention_policy_2025_Placeholder').t`E.g. Cleanup unused mailboxes`;
    }
    return c('retention_policy_2025_Placeholder').t`E.g. Cleanup unused mailboxes`;
};

const getConfirmationMessage = (product: RetentionRuleProduct, lifetime: number | null) => {
    if (lifetime === null) {
        return null;
    }

    if (product === RetentionRuleProduct.Mail) {
        // translator: full sentence
        // 'After 365 days all messages will be deleted, including those in Inbox, Sent and Drafts. This might purge messages that users expect to keep. It is not possible to recover these messages later.'
        const strongText = (
            <strong key="warning-purgeall-message-strong">
                {c('retention_policy_2025_Confirmation').ngettext(
                    msgid`After ${lifetime} day all messages will be deleted`,
                    `After ${lifetime} days all messages will be deleted`,
                    lifetime
                )}
            </strong>
        );

        return c('retention_policy_2025_Confirmation')
            .jt`${strongText}, including those in Inbox, Sent, and Drafts. This might purge messages that users expect to keep. It is not possible to recover these messages later.`;
    }

    return 'Unknown product';
};

const isDuplicatedScope = (scopes: RetentionRuleScopeFormData[]) => {
    const keys = scopes.map((scope) => `${scope.entityType}:${scope.entityID}`);
    return new Set(keys).size !== keys.length;
};

const RetentionPolicyModal = ({
    retentionRule,
    retentionPoliciesManagement,
    onSuccess,
    ...modalProps
}: Props & ModalStateProps) => {
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const {
        modalProps: confirmModalProps,
        openModal: openConfirmModal,
        render: renderConfirmModal,
    } = useModalStateObject();

    const { validateScopes } = useRetentionRuleScopeSuggestion();

    const form = useFormik({
        initialValues: retentionRule ? convertToRetentionRuleFormData(retentionRule) : INITIAL_FORM_VALUES,
        validateOnChange: true,
        validateOnMount: false,
        validate: ({ name, lifetime, action, scopes }) => {
            const errors: FormikErrors<RetentionRuleFormData> = {};
            const nameError = requiredValidator(name);
            if (nameError) {
                errors.name = nameError;
            }
            if (action === RetentionRuleAction.RetainAll && lifetime !== null) {
                errors.lifetime = c('retention_policy_2025_Error').t`Lifetime must not be set for "Retain All" action`;
            }
            if (action !== RetentionRuleAction.RetainAll && (lifetime === null || lifetime < MIN_LIFETIME)) {
                errors.lifetime = c('retention_policy_2025_Error')
                    .t`Lifetime must be greater than ${MIN_LIFETIME} days`;
            }
            if (isDuplicatedScope(scopes)) {
                errors.scopes = c('retention_policy_2025_Error').t`Scopes cannot have the same value`;
            }
            if (!validateScopes(scopes)) {
                errors.scopes = c('retention_policy_2025_Error').t`Scope value is not valid`;
            }
            if (scopes.length > 0 && scopes.some((scope) => !scope.entityID)) {
                errors.scopes = c('retention_policy_2025_Error').t`Scope value is required`;
            }
            return errors;
        },
        onSubmit: async (values) => {
            await withLoading(async () => {
                if (retentionRule) {
                    await retentionPoliciesManagement.editRetentionRule(values);
                } else {
                    await retentionPoliciesManagement.createRetentionRule(values);
                }

                onSuccess?.();
                modalProps.onClose();
            });
        },
    });

    const { values, setValues, errors, isValid, dirty } = form;

    const showValidationErrors = () => {
        Object.values(errors)
            .filter(isTruthy)
            .forEach((message) => {
                createNotification({
                    type: 'error',
                    text: message as string,
                });
            });
    };

    const onFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValid) {
            showValidationErrors();
            return;
        }

        if (values.action === RetentionRuleAction.RetainPurgeAll) {
            openConfirmModal(true);
        } else {
            form.handleSubmit();
        }
    };

    return (
        <ModalTwo size="medium" {...modalProps}>
            <ModalTwoHeader
                title={
                    retentionRule
                        ? c('retention_policy_2025_Title').t`Edit retention rule`
                        : c('retention_policy_2025_Title').t`Create retention rule`
                }
            />
            <ModalTwoContent>
                <FormikProvider value={form}>
                    <Form id={FORM_ID} className="flex flex-column gap-0" onSubmit={onFormSubmit}>
                        <ProductSelection
                            selectedProduct={values.products}
                            onChange={(product) => setValues({ ...values, products: product, scopes: [] })}
                        />
                        <InputFieldTwo
                            id="policy-name"
                            as={TextAreaTwo}
                            rows={2}
                            label={c('retention_policy_2025_Label').t`Rule title`}
                            placeholder={getRuleNamePlaceholder(values.products)}
                            value={values.name}
                            disabled={loading}
                            onValue={(value) => setValues({ ...values, name: value }, true)}
                            error={errors.name}
                            autoFocus
                        />
                        <RetentionDurationSetting values={values} setValues={setValues} />
                        <RetentionScopes values={values} setValues={setValues} />
                    </Form>
                </FormikProvider>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={modalProps.onClose}>{c('retention_policy_2025_Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" form={FORM_ID} loading={loading} disabled={!dirty}>
                    {retentionRule
                        ? c('retention_policy_2025_Action').t`Save changes`
                        : c('retention_policy_2025_Action').t`Create rule`}
                </Button>
            </ModalTwoFooter>
            {renderConfirmModal && (
                <Prompt
                    title={c('retention_policy_2025_Title').t`Confirm retention rule?`}
                    buttons={[
                        <Button
                            color="danger"
                            loading={loading}
                            onClick={() => {
                                void form.submitForm();
                                confirmModalProps.onClose();
                            }}
                            disabled={!dirty || loading}
                        >
                            {c('retention_policy_2025_Action').t`Confirm`}
                        </Button>,
                        <Button autoFocus onClick={() => confirmModalProps.onClose()}>{c('retention_policy_2025_Action')
                            .t`Cancel`}</Button>,
                    ]}
                    {...confirmModalProps}
                >
                    {getConfirmationMessage(values.products, values.lifetime)}
                </Prompt>
            )}
        </ModalTwo>
    );
};

export default RetentionPolicyModal;
