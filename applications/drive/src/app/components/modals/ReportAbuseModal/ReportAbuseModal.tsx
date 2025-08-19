import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
import {
    Form,
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Option,
    SelectTwo,
    TextAreaTwo,
    useFormErrors,
    useModalTwoStatic,
    useNotifications,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

import { sendErrorReport } from '../../../utils/errorHandling';
import { FileCard } from './FileCard';
import type { AbuseCategory, AbuseCateroryType, AbuseFormProps, ReportAbuseRequestPayload } from './types';

const ABUSE_CATEGORIES: AbuseCategory[] = [
    {
        type: 'spam',
        getText: () => c('Label').t`Spam`,
    },
    {
        type: 'copyright',
        getText: () => c('Label').t`Copyright infringement`,
    },
    {
        type: 'child-abuse',
        getText: () => c('Label').t`Child sexual abuse material`,
    },
    {
        type: 'stolen-data',
        getText: () => c('Label').t`Stolen data`,
    },
    {
        type: 'malware',
        getText: () => c('Label').t`Malware`,
    },
    {
        type: 'other',
        getText: () => c('Label').t`Other`,
    },
];

const CATEGORIES_WITH_EMAIL_VERIFICATION: AbuseCateroryType[] = ['copyright', 'stolen-data'];

const ReportAbuseModal = ({ linkInfo, onSubmit, prefilled, ...modalProps }: AbuseFormProps & ModalStateProps) => {
    const [submitting, withSubmitting] = useLoading();
    const { createNotification } = useNotifications();

    const { validator, onFormSubmit } = useFormErrors();
    const [model, setModel] = useState(() => {
        return {
            Category: prefilled?.Category || (null as null | AbuseCateroryType),
            Email: prefilled?.Email || '',
            Comment: prefilled?.Comment || '',
        };
    });

    const INFO_TEXT = c('Info').t`Use this form to notify us of inappropriate, illegal,
    or otherwise malicious shared files. You are about to report:`;

    const TEXTAREA_PLACEHOLDER = c('Label').t`Please provide full details to help us take appropriate action`;

    const handleChange = (key: keyof typeof model) => {
        return (value: any) => setModel({ ...model, [key]: value });
    };

    const handleSubmit = async () => {
        if (!onFormSubmit()) {
            return;
        }

        try {
            const payload: ReportAbuseRequestPayload = {
                linkId: linkInfo.linkId,
                abuseCategory: model.Category!,
            };
            if (model.Email) {
                payload.reporterEmail = model.Email;
            }
            if (model.Comment) {
                payload.reporterMessage = model.Comment;
            }

            await onSubmit(payload);
            createNotification({ text: c('Info').t`Report has been sent` });
            modalProps.onClose();
        } catch (e) {
            createNotification({ text: c('Error').t`Report failed to be sent`, type: 'error' });
            sendErrorReport(e);
        }
    };

    const requiresAdditionalValidation =
        CATEGORIES_WITH_EMAIL_VERIFICATION.includes(model.Category!) && model.Category !== null;
    const emailValidation = requiresAdditionalValidation ? validator([emailValidator(model.Email)]) : null;
    const commentValidation = requiresAdditionalValidation ? validator([requiredValidator(model.Comment)]) : null;

    return (
        <ModalTwo
            as={Form}
            onReset={modalProps.onClose}
            onSubmit={() => withSubmitting(handleSubmit()).catch(noop)}
            size="small"
            {...modalProps}
        >
            <ModalTwoHeader title={c('Action').t`Submit report`} />
            <ModalTwoContent>
                <p className="mt-0">{INFO_TEXT}</p>
                <FileCard linkInfo={linkInfo} className="mb-4" />
                <div className="mb-2">
                    <InputFieldTwo
                        aria-required
                        as={SelectTwo}
                        autoFocus
                        disabled={submitting}
                        error={validator([requiredValidator(model.Category)])}
                        id="Category"
                        label={c('Label').t`Category`}
                        onValue={handleChange('Category')}
                        placeholder={c('Label').t`Select type of abuse`}
                        value={model.Category}
                    >
                        {ABUSE_CATEGORIES.map((option) => (
                            <Option title={option.getText()} value={option.type} key={option.type} />
                        ))}
                    </InputFieldTwo>
                </div>
                <div className="mb-2">
                    <InputFieldTwo
                        data-testid="report-abuse-email"
                        disabled={submitting}
                        error={emailValidation}
                        id="LinkName"
                        label={c('Label').t`Email`}
                        onValue={handleChange('Email')}
                        placeholder={c('Placeholder').t`Enter your email address`}
                        type="email"
                        value={model.Email}
                    />
                </div>
                <div className="mb-2">
                    <InputFieldTwo
                        as={TextAreaTwo}
                        disabled={submitting}
                        error={commentValidation}
                        id="Comment"
                        label={c('Label').t`Comment`}
                        onValue={handleChange('Comment')}
                        placeholder={TEXTAREA_PLACEHOLDER}
                        rows={2}
                        value={model.Comment}
                    />
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="weak" type="reset" disabled={submitting} onClick={modalProps.onClose}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button color="norm" type="submit" loading={submitting}>
                    {c('Action').t`Submit`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export const useReportAbuseModal = () => {
    return useModalTwoStatic(ReportAbuseModal);
};
