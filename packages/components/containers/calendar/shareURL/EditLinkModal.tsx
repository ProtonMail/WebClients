import { useState } from 'react';
import { Nullable } from '@proton/shared/lib/interfaces/utils';
import { c } from 'ttag';

import { BasicModal, InputTwo, Button, Form } from '../../../components';
import { useLoading, useNotifications } from '../../../hooks';

interface Props {
    decryptedPurpose: Nullable<string>;
    onClose: () => void;
    onSubmit: (purpose: string) => Promise<void>;
    isOpen: boolean;
}

const EditLinkModal = ({ decryptedPurpose, onClose, onSubmit, isOpen }: Props) => {
    const [purpose, setPurpose] = useState(decryptedPurpose || '');
    const [isLoading, withLoading] = useLoading();
    const { createNotification } = useNotifications();

    const handleSubmit = async () => {
        const text = (() => {
            if (!decryptedPurpose && purpose) {
                return c('Calendar link purpose update success message').t`Label added`;
            }

            if (decryptedPurpose && purpose) {
                return c('Calendar link purpose update success message').t`Label edited`;
            }

            if (decryptedPurpose && !purpose) {
                return c('Calendar link purpose update success message').t`Label deleted`;
            }

            return null;
        })();

        if (text) {
            await onSubmit(purpose);

            createNotification({ text });
        }

        onClose();
    };

    return (
        <BasicModal
            title={decryptedPurpose ? c('Info').t`Edit label` : c('Info').t`Add label`}
            footer={
                <>
                    <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                    <Button color="norm" type="submit" loading={isLoading}>{c('Action').t`Save`}</Button>
                </>
            }
            isOpen={isOpen}
            size="medium"
            onSubmit={() => {
                if (!isLoading) {
                    withLoading(handleSubmit());
                }
            }}
            onClose={onClose}
            as={Form}
        >
            <p className="mt0">{c('Info').t`Only you can see the labels.`}</p>
            <label htmlFor="your-calendar-url-label" className="sr-only">
                {c('Label').t`Your calendar URL label`}
            </label>
            <InputTwo
                id="your-calendar-url-label"
                maxLength={50}
                autoFocus
                value={purpose}
                onChange={({ target: { value } }) => setPurpose(value)}
            />
        </BasicModal>
    );
};

export default EditLinkModal;
