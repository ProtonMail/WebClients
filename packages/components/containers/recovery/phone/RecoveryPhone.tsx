import { useState } from 'react';
import { c } from 'ttag';
import { updatePhone } from '@proton/shared/lib/api/settings';

import { Button, InputFieldTwo, PhoneInput, useFormErrors } from '../../../components';
import { useNotifications, useEventManager, useModals, useLoading } from '../../../hooks';
import { classnames } from '../../../helpers';
import ConfirmRemovePhoneModal from './ConfirmRemovePhoneModal';
import AuthModal from '../../password/AuthModal';

interface Props {
    phone: string | null;
    hasReset: boolean;
    defaultCountry?: string;
    className?: string;
}

const RecoveryPhone = ({ phone, hasReset, defaultCountry, className }: Props) => {
    const [input, setInput] = useState(phone || '');
    const [submitting, withSubmitting] = useLoading();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();
    const { onFormSubmit } = useFormErrors();

    const handleSubmit = async () => {
        const confirmStep = !input && hasReset;
        if (confirmStep) {
            await new Promise<void>((resolve, reject) => {
                createModal(<ConfirmRemovePhoneModal onClose={reject} onConfirm={resolve} />);
            });
        }

        await new Promise((resolve, reject) => {
            createModal(<AuthModal onClose={reject} onSuccess={resolve} config={updatePhone({ Phone: input })} />);
        });

        await call();

        createNotification({ text: c('Success').t`Phone number updated` });
    };

    return (
        <form
            className={classnames(['flex flex-wrap on-mobile-flex-column', className])}
            onSubmit={(e) => {
                e.preventDefault();
                if (onFormSubmit()) {
                    void withSubmitting(handleSubmit());
                }
            }}
        >
            <div className="mr1 on-mobile-mr0 flex-item-fluid min-w14e">
                <InputFieldTwo
                    as={PhoneInput}
                    id="phoneInput"
                    disableChange={submitting}
                    defaultCountry={defaultCountry}
                    value={input}
                    onChange={setInput}
                    aria-label={c('label').t`Recovery phone number`}
                />
            </div>
            <div className="mb0-5">
                <Button
                    shape="outline"
                    type="submit"
                    disabled={(phone || '') === input}
                    loading={submitting}
                    data-testid="account:recovery:phoneSubmit"
                >
                    {c('Action').t`Save`}
                </Button>
            </div>
        </form>
    );
};

export default RecoveryPhone;
