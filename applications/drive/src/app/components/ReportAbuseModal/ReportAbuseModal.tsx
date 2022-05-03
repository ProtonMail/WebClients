import React, { useState } from 'react';
import { c } from 'ttag';

import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import { noop } from '@proton/shared/lib/helpers/function';
import {
    SelectTwo,
    useLoading,
    useNotifications,
    Option,
    TextAreaTwo,
    ModalTwo,
    ModalTwoHeader,
    ModalTwoContent,
    ModalTwoFooter,
    PrimaryButton,
    Button,
    InputFieldTwo,
    useFormErrors,
    Form,
} from '@proton/components';

import { FileCard } from './FileCard';
import { AbuseCategory, AbuseCateroryType, AbuseFormProps, ReportAbuseRequestPayload } from './types';

const ABUSE_CATEGORIES: AbuseCategory[] = [
    {
        type: 'spam',
        text: c('Label').t`Spam`,
    },
    {
        type: 'copyright',
        text: c('Label').t`Copyright infringement`,
    },
    {
        type: 'child-abuse',
        text: c('Label').t`Child sexual abuse material`,
    },
    {
        type: 'stolen-data',
        text: c('Label').t`Stolen data`,
    },
    {
        type: 'malware',
        text: c('Label').t`Malware`,
    },
    {
        type: 'other',
        text: c('Label').t`Other`,
    },
];

const CATEGORIES_WITH_EMAIL_VERIFICATION: AbuseCateroryType[] = ['copyright', 'stolen-data'];

const ReportAbuseModal = ({ onClose = noop, linkInfo, password, onSubmit, open }: AbuseFormProps) => {
    const [submitting, withSubmitting] = useLoading();
    const { createNotification } = useNotifications();

    const { validator, onFormSubmit } = useFormErrors();
    const [model, setModel] = useState(() => {
        return {
            Category: null as null | AbuseCateroryType,
            Email: '',
            Comment: '',
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
                abuseCategory: model.Category!,
                shareURL: window.location.href,
                password,
                nodePassphrase: linkInfo.nodePassphrase,
            };

            if (model.Email) {
                payload.reporterEmail = model.Email;
            }

            if (model.Comment) {
                payload.reporterMessage = model.Comment;
            }

            await onSubmit(payload);
            createNotification({ text: c('Info').t`Report has been sent` });
            onClose?.();
        } catch (e) {
            createNotification({ text: c('Error').t`Report failed to be sent`, type: 'error' });
        }
    };

    const requiresAdditionalValidation =
        CATEGORIES_WITH_EMAIL_VERIFICATION.includes(model.Category!) && model.Category !== null;
    const emailValidation = requiresAdditionalValidation ? validator([emailValidator(model.Email)]) : null;
    const commentValidation = requiresAdditionalValidation ? validator([requiredValidator(model.Comment)]) : null;

    return (
        <ModalTwo
            size="small"
            as={Form}
            onSubmit={() => withSubmitting(handleSubmit()).catch(noop)}
            onClose={onClose}
            onReset={onClose}
            open={open}
        >
            <ModalTwoHeader title={c('Action').t`Submit report`} />
            <ModalTwoContent>
                <p className="mt0">{INFO_TEXT}</p>
                <FileCard linkInfo={linkInfo} className="mb1" />
                <div className="mb0-5">
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
                            <Option title={option.text} value={option.type} key={option.type} />
                        ))}
                    </InputFieldTwo>
                </div>
                <div className="mb0-5">
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
                <div className="mb0-5">
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
                <Button color="weak" type="reset" disabled={submitting} onClick={onClose}>
                    {c('Action').t`Cancel`}
                </Button>
                <PrimaryButton type="submit" loading={submitting}>
                    {c('Action').t`Submit`}
                </PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ReportAbuseModal;
