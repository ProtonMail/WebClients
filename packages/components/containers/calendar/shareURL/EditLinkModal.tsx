import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import BasicModal from '@proton/components/components/modalTwo/BasicModal';
import type { BasicModalProps } from '@proton/components/components/modalTwo/BasicModal';
import { useLoading } from '@proton/hooks';
import { MAX_CHARS_CLEARTEXT } from '@proton/shared/lib/calendar/constants';
import type { Nullable } from '@proton/shared/lib/interfaces/utils';

import { InputFieldTwo } from '../../../components';
import { useNotifications } from '../../../hooks';

interface EditLinkModalProps extends Omit<BasicModalProps, 'children' | 'footer'> {
    decryptedPurpose: Nullable<string>;
    onClose: () => void;
    onSubmit: (purpose: string) => Promise<void>;
    isOpen: boolean;
}

const EditLinkModal = ({ decryptedPurpose, onClose, onSubmit, ...rest }: EditLinkModalProps) => {
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
            {...rest}
            title={decryptedPurpose ? c('Info').t`Edit label` : c('Info').t`Add label`}
            footer={
                <>
                    <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                    <Button color="norm" type="submit" loading={isLoading}>{c('Action').t`Save`}</Button>
                </>
            }
            size="medium"
            onSubmit={() => {
                if (!isLoading) {
                    withLoading(handleSubmit());
                }
            }}
            onClose={onClose}
            as={Form}
        >
            <InputFieldTwo
                label={c('Label').t`Link label (optional)`}
                assistiveText={c('Info').t`Only you can see the label`}
                placeholder={c('Shared calendar label input placeholder').t`Add label`}
                id="your-calendar-url-label"
                maxLength={MAX_CHARS_CLEARTEXT.PURPOSE}
                autoFocus
                value={purpose}
                // @ts-ignore
                onValue={(value) => setPurpose(value)}
            />
        </BasicModal>
    );
};

export default EditLinkModal;
