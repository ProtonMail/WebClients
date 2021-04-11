import React, { useState } from 'react';
import { c } from 'ttag';
import { updatePhone } from 'proton-shared/lib/api/settings';

import AuthModal from '../password/AuthModal';
import { ConfirmModal, Alert, IntlTelInput, Button } from '../../components';
import { useLoading, useModals, useNotifications, useEventManager } from '../../hooks';

import './RecoveryPhone.scss';

interface Props {
    phone: string | null;
    hasReset: boolean;
}

const RecoveryPhone = ({ phone, hasReset }: Props) => {
    const [input, setInput] = useState(phone || '');
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();

    const handleChange = (status: any, value: any, countryData: any, number: string) => setInput(number);

    const handleSubmit = async () => {
        if (!input && hasReset) {
            await new Promise<void>((resolve, reject) => {
                createModal(
                    <ConfirmModal title={c('Title').t`Confirm phone number`} onConfirm={resolve} onClose={reject}>
                        <Alert type="warning">
                            {c('Warning')
                                .t`By deleting this phone number, you will no longer be able to recover your account.`}
                            <br />
                            <br />
                            {c('Warning').t`Are you sure you want to delete the phone number?`}
                        </Alert>
                    </ConfirmModal>
                );
            });
        }

        await new Promise((resolve, reject) => {
            createModal(<AuthModal onClose={reject} onSuccess={resolve} config={updatePhone({ Phone: input })} />);
        });

        await call();
        createNotification({ text: c('Success').t`Phone number updated` });
    };

    return (
        <div className="recovery-phone_container">
            <div className="recovery-phone_phone-input">
                <IntlTelInput
                    id="phoneInput"
                    placeholder={c('Info').t`Not set`}
                    containerClassName="w100"
                    inputClassName="w100"
                    onPhoneNumberChange={handleChange}
                    defaultValue={input}
                    dropdownContainer="body"
                    required
                />
            </div>
            <div>
                <Button
                    color="norm"
                    disabled={(phone || '') === input}
                    loading={loading}
                    onClick={() => withLoading(handleSubmit())}
                >
                    {c('Action').t`Update`}
                </Button>
            </div>
        </div>
    );
};

export default RecoveryPhone;
