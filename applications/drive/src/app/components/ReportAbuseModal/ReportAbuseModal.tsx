import React, { useState, ChangeEvent } from 'react';
import { c } from 'ttag';

import { noop } from '@proton/shared/lib/helpers/function';
import {
    SelectTwo,
    useLoading,
    useNotifications,
    Option,
    Label,
    Field,
    InputTwo,
    TextAreaTwo,
    ModalTwo,
    ModalTwoHeader,
    ModalTwoContent,
    ModalTwoFooter,
    PrimaryButton,
    Button,
} from '@proton/components';
import { FileCard } from './FileCard';
import { SharedURLInfoDecrypted } from '../../hooks/drive/usePublicSharing';

interface Props {
    onClose?: () => void;
    linkInfo: SharedURLInfoDecrypted;
    password?: string;
    onSubmit: (params: {
        abuseCategory: string;
        reporterEmail?: string;
        reporterMessage?: string;
        password?: string;
        shareURL: string;
        nodePassphrase: string;
    }) => Promise<void>;
}

type AbuseCateroryType = 'spam' | 'copyright' | 'child-abuse' | 'stolen-data' | 'malware' | 'other';

interface AbuseCategory {
    type: AbuseCateroryType;
    text: string;
}

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

const ReportAbuseModal = ({ onClose = noop, linkInfo, password, onSubmit, ...rest }: Props) => {
    const [submitting, withSubmitting] = useLoading();
    const { createNotification } = useNotifications();

    const [email, setEmail] = useState<string>();
    const [comment, setComment] = useState<string>();
    const [category, setCategory] = useState<AbuseCategory | null>(null);

    const INFO_TEXT = c('Info').t`Use this form to notify us of inappropriate, illegal,
    or otherwise malicious shared files. You are about to report:`;

    const TEXTAREA_PLACEHOLDER = c('Label').t`Please provide full \
    details to help us take appropriate action`;

    const handleEmailChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        setEmail(target.value);
    };

    const handleCommentChange = ({ target }: ChangeEvent<HTMLTextAreaElement>) => {
        setComment(target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (category === null) {
            createNotification({
                text: c('Error').t`Category field is required`,
                type: 'error',
            });
            return;
        }

        try {
            await onSubmit({
                reporterEmail: email,
                reporterMessage: comment,
                abuseCategory: category!.type,
                shareURL: window.location.href,
                password,
                nodePassphrase: linkInfo.nodePassphrase,
            });

            createNotification({ text: c('Info').t`Report has been sent` });
            onClose?.();
        } catch (e) {
            createNotification({ text: c('Error').t`Report failed to be sent`, type: 'error' });
        }
    };

    const hasRequiredInputFields = Boolean(
        category && (category.type === 'copyright' || category.type === 'stolen-data')
    );

    return (
        <ModalTwo
            size="small"
            as="form"
            onSubmit={(e: React.FormEvent) => withSubmitting(handleSubmit(e)).catch(noop)}
            onClose={onClose}
            onReset={onClose}
            {...rest}
        >
            <ModalTwoHeader title={c('Action').t`Submit report`} />
            <ModalTwoContent>
                <p className="mt0">{INFO_TEXT}</p>
                <FileCard linkInfo={linkInfo} className="mb1" />
                <Field className="w100 mb1">
                    <Label className="mb0-5 block">{c('Label').t`Category`}</Label>
                    <SelectTwo
                        aria-required
                        autoFocus
                        value={category}
                        onChange={({ value }) => setCategory(value)}
                        placeholder={c('Label').t`Select type of abuse`}
                    >
                        {ABUSE_CATEGORIES.map((option) => (
                            <Option title={option.text} value={option} key={option.type} />
                        ))}
                    </SelectTwo>
                </Field>
                <Field className="w100 mb1">
                    <Label className="mb0-5 block">{c('Label').t`Email`}</Label>
                    <InputTwo
                        id="link-name"
                        value={email}
                        type="email"
                        placeholder={c('Placeholder').t`Enter your email address`}
                        data-testid="report-abuse-email"
                        onChange={handleEmailChange}
                        required={hasRequiredInputFields}
                    />
                </Field>
                <Field className="w100 mb2">
                    <Label className="mb0-5 block">{c('Label').t`Comment`}</Label>
                    <TextAreaTwo
                        rows={2}
                        className="field w100 field-pristine"
                        placeholder={TEXTAREA_PLACEHOLDER}
                        value={comment}
                        onChange={handleCommentChange}
                        required={hasRequiredInputFields}
                    />
                </Field>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="weak" type="reset" disabled={submitting} onClick={onClose}>
                    {c('Action').t`Cancel`}
                </Button>
                <PrimaryButton type="submit" disabled={submitting} onClick={handleSubmit}>
                    {c('Action').t`Submit`}
                </PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default ReportAbuseModal;
