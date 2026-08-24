import type { ComponentPropsWithoutRef, FormEvent, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcPen } from '@proton/icons/icons/IcPen';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcTrash } from '@proton/icons/icons/IcTrash';

import { StatusBadge, StatusBadgeStatus } from '../layout/StatusBadge';

interface InputRowProps {
    input: ReactNode;
    hasValue: boolean;
    isEditing: boolean;
    onEdit: () => void;
    onRemove: () => void;
}

const InputRow = ({ input, hasValue, isEditing, onEdit, onRemove }: InputRowProps) => (
    <div className="flex items-center gap-2 mb-2 flex-nowrap">
        <div className="w-full max-w-custom fade-in" style={{ '--max-w-custom': '25rem' }}>
            {input}
        </div>
        {hasValue && !isEditing && (
            <div className="flex flex-nowrap shrink-0">
                <Tooltip title={c('Action').t`Edit`}>
                    <Button
                        shape="ghost"
                        type="button"
                        size="small"
                        icon
                        onClick={(event) => {
                            event.preventDefault();
                            onEdit();
                        }}
                    >
                        <IcPen alt={c('Action').t`Edit`} />
                    </Button>
                </Tooltip>
                <Tooltip title={c('Action').t`Remove`}>
                    <Button
                        shape="ghost"
                        type="button"
                        size="small"
                        icon
                        onClick={(event) => {
                            event.preventDefault();
                            onRemove();
                        }}
                    >
                        <IcTrash alt={c('Action').t`Remove`} />
                    </Button>
                </Tooltip>
            </div>
        )}
    </div>
);

interface ActionsProps {
    submitButtonProps: ComponentPropsWithoutRef<typeof Button>;
    hasValue: boolean;
    isEditing: boolean;
    onKeep: () => void;
}

const Actions = ({ submitButtonProps, hasValue, isEditing, onKeep }: ActionsProps) => {
    if (hasValue && !isEditing) {
        return null;
    }
    return (
        <div className="flex items-center gap-2">
            {isEditing ? (
                <>
                    <Button className="inline-flex items-center gap-1" color="norm" {...submitButtonProps}>
                        {c('Action').t`Save and verify`}
                    </Button>
                    <Button shape="ghost" color="norm" onClick={onKeep}>
                        {c('Action').t`Keep`}
                    </Button>
                </>
            ) : (
                <Button className="inline-flex items-center gap-1" color="norm" {...submitButtonProps}>
                    <IcPlus /> {c('Action').t`Add and verify`}
                </Button>
            )}
        </div>
    );
};

interface VerificationStatusProps {
    hasValue: boolean;
    isEditing: boolean;
    isVerified: boolean;
    onVerify: () => void;
}

const VerificationStatus = ({ hasValue, isEditing, isVerified, onVerify }: VerificationStatusProps) => {
    if (!hasValue || isEditing) {
        return null;
    }
    return isVerified ? (
        <StatusBadge status={StatusBadgeStatus.Success} text={c('Status').t`Verified`} />
    ) : (
        <div className="flex items-center gap-2">
            <StatusBadge status={StatusBadgeStatus.Warning} text={c('Status').t`Unverified`} />
            <Button shape="ghost" color="norm" size="small" type="button" onClick={onVerify}>
                {c('Action').t`Verify`}
            </Button>
        </div>
    );
};

interface RecoveryFieldFormProps {
    /** The persisted value, empty when the field is not set yet. */
    value: string;
    isVerified: boolean;
    /** True only while an existing value is being edited. */
    isEditing: boolean;
    onEdit: () => void;
    /** Discards the in-progress edit and keeps the persisted value. */
    onKeep: () => void;
    input: ReactNode;
    submitButtonProps: ComponentPropsWithoutRef<typeof Button>;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onVerify: () => void;
    onRemove: () => void;
}

/**
 * Shared `renderForm` body for the recovery email and phone fields: a read-only value with edit and
 * remove buttons, add/save actions while editing, and the verification status underneath.
 */
export const RecoveryFieldForm = ({
    value,
    isVerified,
    isEditing,
    onEdit,
    onKeep,
    input,
    submitButtonProps,
    onSubmit,
    onVerify,
    onRemove,
}: RecoveryFieldFormProps) => {
    const hasValue = !!value;

    return (
        <form onSubmit={onSubmit}>
            <InputRow input={input} hasValue={hasValue} isEditing={isEditing} onEdit={onEdit} onRemove={onRemove} />
            <Actions submitButtonProps={submitButtonProps} hasValue={hasValue} isEditing={isEditing} onKeep={onKeep} />
            <VerificationStatus hasValue={hasValue} isEditing={isEditing} isVerified={isVerified} onVerify={onVerify} />
        </form>
    );
};
