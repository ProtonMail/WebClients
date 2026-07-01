import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalStateProps } from '@proton/components';
import {
    Checkbox,
    Form,
    InputFieldTwo,
    Label,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Option,
    SelectTwo,
    TextAreaTwo,
    useFormErrors,
} from '@proton/components';
import { AbuseCategory, type NodeType } from '@proton/drive';
import ModalContentLoader from '@proton/drive/modals/modalUtils/ModalContentLoader';
import { useLoading } from '@proton/hooks';
import { emailValidator, requiredValidator } from '@proton/shared/lib/helpers/formValidators';

import { FileCard } from './FileCard';
import type { AbuseReportPrefill } from './types';
import { ABUSE_CATEGORIES, CATEGORIES_WITH_EMAIL_VERIFICATION } from './useReportAbuseModalState';

export type ReportAbuseModalViewProps =
    | (LoadedReportAbuseModalViewProps & ModalStateProps & { loaded: true })
    | { loaded: false };

type LoadedReportAbuseModalViewProps = {
    handleSubmit: (formData: { category: AbuseCategory; email?: string; comment?: string }) => Promise<void>;
    name: string;
    size: number | undefined;
    mediaType: string | undefined;
    type: NodeType;
    prefilled?: AbuseReportPrefill;
};

const ReportAbuseModalViewContent = ({
    handleSubmit,
    name,
    size,
    mediaType,
    type,
    prefilled,
    onClose,
    onExit,
    open,
}: LoadedReportAbuseModalViewProps & ModalStateProps) => {
    const [submitting, withSubmitting] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();
    const defaultCategory = AbuseCategory.Other;

    const [model, setModel] = useState<{
        category: AbuseCategory | null;
        email: string;
        comment: string;
        bonaFide: boolean;
    }>(() => {
        return {
            category: prefilled?.category ?? null,
            email: prefilled?.email ?? '',
            comment: prefilled?.comment ?? '',
            bonaFide: false,
        };
    });

    const INFO_TEXT = c('Info').t`Use this form to notify us of inappropriate, illegal,
    or otherwise malicious shared files. You are about to report:`;

    const TEXTAREA_PLACEHOLDER = c('Label').t`Please provide full details to help us take appropriate action`;

    // SelectTwo's onValue expects (value: unknown) => void
    const handleCategoryChange = (value: unknown) => {
        setModel({ ...model, category: value as AbuseCategory | null });
    };

    const handleEmailChange = (value: string) => {
        setModel({ ...model, email: value });
    };

    const handleCommentChange = (value: string) => {
        setModel({ ...model, comment: value });
    };
    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!onFormSubmit()) {
            return;
        }

        return handleSubmit({
            category: model.category ?? defaultCategory,
            email: model.email || undefined,
            comment: model.comment || undefined,
        });
    };

    const requiresAdditionalValidation =
        CATEGORIES_WITH_EMAIL_VERIFICATION.includes(model.category ?? defaultCategory) && model.category !== null;
    const emailValidation = requiresAdditionalValidation ? validator([emailValidator(model.email)]) : null;
    const commentValidation = requiresAdditionalValidation ? validator([requiredValidator(model.comment)]) : null;
    const bonaFideValidation = validator([!model.bonaFide ? c('Error').t`This field is required` : '']);

    return (
        <ModalTwo
            as={Form}
            onReset={onClose}
            onSubmit={(e: React.FormEvent) => withSubmitting(onSubmit(e))}
            size="small"
            onClose={onClose}
            onExit={onExit}
            open={open}
        >
            <ModalTwoHeader title={c('Action').t`Submit report`} />
            <ModalTwoContent>
                <p className="mt-0">{INFO_TEXT}</p>
                <FileCard name={name} size={size} mediaType={mediaType} type={type} className="mb-4" />
                <div className="mb-2">
                    <InputFieldTwo
                        aria-required
                        as={SelectTwo}
                        autoFocus
                        disabled={submitting}
                        error={validator([requiredValidator(model.category)])}
                        id="category"
                        label={c('Label').t`Category`}
                        onValue={handleCategoryChange}
                        placeholder={c('Label').t`Select type of abuse`}
                        value={model.category}
                    >
                        {ABUSE_CATEGORIES.map((option) => {
                            return <Option title={option.getText()} value={option.type} key={option.type} />;
                        })}
                    </InputFieldTwo>
                </div>
                <div className="mb-2">
                    <InputFieldTwo
                        data-testid="report-abuse-email"
                        disabled={submitting}
                        error={emailValidation}
                        id="email"
                        label={c('Label').t`Email`}
                        onValue={handleEmailChange}
                        placeholder={c('Placeholder').t`Enter your email address`}
                        type="email"
                        value={model.email}
                    />
                </div>
                <div className="mb-2">
                    <InputFieldTwo
                        as={TextAreaTwo}
                        disabled={submitting}
                        error={commentValidation}
                        id="comment"
                        label={c('Label').t`Comment`}
                        onValue={handleCommentChange}
                        placeholder={TEXTAREA_PLACEHOLDER}
                        rows={2}
                        value={model.comment}
                    />
                </div>
                <div className="mb-2">
                    <div className="flex flex-row items-start gap-2">
                        <Checkbox
                            id="bona-fide"
                            className="pt-1"
                            checked={model.bonaFide}
                            disabled={submitting}
                            onChange={(e) => setModel({ ...model, bonaFide: e.target.checked })}
                            aria-describedby="bona-fide-description"
                            data-testid="report-abuse-bona-fide"
                        />
                        <Label htmlFor="bona-fide" className="pt-0 flex-1 text-sm color-weak">
                            {c('Info')
                                .t`I hereby confirm that I am in good faith that the information and statements contained in the report are correct and complete.`}
                        </Label>
                    </div>
                    {bonaFideValidation && <p className="text-sm color-danger mt-1">{bonaFideValidation}</p>}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="weak" type="reset" disabled={submitting} onClick={onClose}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button color="norm" type="submit" loading={submitting}>
                    {c('Action').t`Submit`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export const ReportAbuseModalView: React.FC<ReportAbuseModalViewProps> = (props) => {
    if (!props.loaded) {
        return (
            <ModalTwo as="form" open={true} size="small">
                <ModalTwoContent>
                    <ModalContentLoader>{c('Info').t`Loading`}</ModalContentLoader>
                </ModalTwoContent>
            </ModalTwo>
        );
    }
    return <ReportAbuseModalViewContent {...props} />;
};
