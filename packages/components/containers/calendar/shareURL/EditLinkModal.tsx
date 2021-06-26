import React, { useState } from 'react';
import { Nullable } from '@proton/shared/lib/interfaces/utils';
import { c } from 'ttag';

import { Alert, FormModal, Input } from '../../../components';
import { useLoading } from '../../../hooks';

interface Props {
    decryptedPurpose: Nullable<string>;
    onClose: () => void;
    onSubmit: (purpose: string) => Promise<void>;
}

const EditLinkModal = ({ decryptedPurpose, onClose, onSubmit, ...rest }: Props) => {
    const [purpose, setPurpose] = useState(decryptedPurpose || '');
    const [isLoading, withLoading] = useLoading();

    const handleSubmit = async () => {
        await onSubmit(purpose);
        onClose();
    };

    return (
        <FormModal
            title={decryptedPurpose ? c('Info').t`Edit label` : c('Info').t`Add label`}
            onSubmit={() => withLoading(handleSubmit())}
            submit={c('Action').t`Save`}
            onClose={onClose}
            loading={isLoading}
            {...rest}
        >
            <Alert>{c('Info').t`Only you can see the labels.`}</Alert>
            <label htmlFor="your-calendar-url-label" className="sr-only">
                {c('Label').t`Your calendar URL label`}
            </label>
            <Input
                id="your-calendar-url-label"
                maxLength={50}
                autoFocus
                value={purpose}
                onChange={({ target: { value } }) => setPurpose(value)}
            />
        </FormModal>
    );
};

export default EditLinkModal;
