import { useState } from 'react';
import { Nullable } from '@proton/shared/lib/interfaces/utils';
import { c } from 'ttag';

import { InputTwo, Button, BasicModal, Form } from '../../../components';
import { useLoading } from '../../../hooks';

interface Props {
    decryptedPurpose: Nullable<string>;
    onClose: () => void;
    onSubmit: (purpose: string) => Promise<void>;
    isOpen: boolean;
}

const EditLinkModal = ({ decryptedPurpose, onClose, onSubmit, isOpen }: Props) => {
    const [purpose, setPurpose] = useState(decryptedPurpose || '');
    const [isLoading, withLoading] = useLoading();

    const handleSubmit = async () => {
        await onSubmit(purpose);
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
