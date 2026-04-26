import { type MouseEvent, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcPassShieldFillSuccess } from '@proton/icons/icons/IcPassShieldFillSuccess';
import noop from '@proton/utils/noop';

export function DirectSharingFooter({
    onSubmit,
    onCancel,
    loading,
    disabled,
    cleanFields,
}: {
    onSubmit: (e: MouseEvent) => Promise<void>;
    onCancel: () => void;
    loading: boolean;
    disabled: boolean;
    cleanFields: () => void;
}) {
    const [showEncryptionText, setShowEncryptionText] = useState(false);
    const [showFinishedText, setShowFinishedText] = useState(false);

    let submitButtonText = c('Action').t`Share`;
    if (showEncryptionText) {
        submitButtonText = c('Action').t`Encrypted`;
    } else if (showFinishedText) {
        submitButtonText = c('Action').t`Shared`;
    }

    async function handleSubmit(e: MouseEvent) {
        await onSubmit(e);

        // We're faking transition through "Encrypted" text for UX purposess
        setShowEncryptionText(true);

        setTimeout(() => {
            setShowFinishedText(true);
            setShowEncryptionText(false);

            setTimeout(() => {
                setShowEncryptionText(false);
                cleanFields();
            }, 1000);
        }, 1000);
    }

    return (
        <div className="w-full flex justify-space-between pt-5">
            <Button disabled={loading || showEncryptionText || showFinishedText} onClick={onCancel}>{c('Action')
                .t`Cancel`}</Button>
            <Button
                type="submit"
                color={showFinishedText ? 'success' : 'norm'}
                shape={showFinishedText ? 'outline' : 'solid'}
                disabled={disabled}
                loading={loading || showEncryptionText}
                onClick={showEncryptionText || showFinishedText ? noop : handleSubmit}
            >
                {submitButtonText}
                {showFinishedText && <IcPassShieldFillSuccess className="color-success ml-2 mb-1" />}
            </Button>
        </div>
    );
}
