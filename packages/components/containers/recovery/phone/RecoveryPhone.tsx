import { useState } from 'react';
import { c } from 'ttag';
import { updatePhone } from '@proton/shared/lib/api/settings';
import { SETTINGS_STATUS, UserSettings } from '@proton/shared/lib/interfaces';

import { Button, Icon, InputFieldTwo, PhoneInput, useFormErrors, useModalState } from '../../../components';
import { useNotifications, useEventManager, useModals, useLoading } from '../../../hooks';
import { classnames } from '../../../helpers';
import ConfirmRemovePhoneModal from './ConfirmRemovePhoneModal';
import AuthModal from '../../password/AuthModal';
import VerifyRecoveryPhoneModal from './VerifyRecoveryPhoneModal';

interface Props {
    phone: UserSettings['Phone'];
    hasReset: boolean;
    defaultCountry?: string;
    className?: string;
}

const RecoveryPhone = ({ phone, hasReset, defaultCountry, className }: Props) => {
    const [input, setInput] = useState(phone.Value || '');
    const [submitting, withSubmitting] = useLoading();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();
    const { onFormSubmit } = useFormErrors();
    const [verifyRecoveryPhoneModal, setVerifyRecoveryPhoneModalOpen, renderVerifyRecoveryPhoneModal] = useModalState();

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
        <>
            {renderVerifyRecoveryPhoneModal && <VerifyRecoveryPhoneModal phone={phone} {...verifyRecoveryPhoneModal} />}
            <form
                className={classnames(['flex flex-wrap on-mobile-flex-column', className])}
                onSubmit={(e) => {
                    e.preventDefault();
                    if (onFormSubmit()) {
                        void withSubmitting(handleSubmit());
                    }
                }}
            >
                <div className="mr1 mb1 on-mobile-mr0 flex-item-fluid min-w14e">
                    <InputFieldTwo
                        as={PhoneInput}
                        id="phoneInput"
                        disableChange={submitting}
                        defaultCountry={defaultCountry}
                        value={input}
                        onChange={setInput}
                        aria-label={c('label').t`Recovery phone number`}
                        assistiveText={
                            phone.Value &&
                            (phone.Status === SETTINGS_STATUS.UNVERIFIED ? (
                                <>
                                    <Icon
                                        className="color-danger flex-item-noshrink aligntop mr0-25"
                                        name="exclamation-circle-filled"
                                    />
                                    <span className="color-norm mr0-5">{c('Recovery Phone')
                                        .t`Phone number not yet verified.`}</span>
                                    <button
                                        className="link"
                                        type="button"
                                        onClick={() => setVerifyRecoveryPhoneModalOpen(true)}
                                    >
                                        {c('Recovery Phone').t`Verify now`}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Icon
                                        className="color-success flex-item-noshrink aligntop mr0-25"
                                        name="checkmark-circle-filled"
                                    />
                                    <span className="mr0-5">{c('Recovery Phone')
                                        .t`Phone number has been verified.`}</span>
                                </>
                            ))
                        }
                    />
                </div>
                <div className="mb0-5">
                    <Button
                        shape="outline"
                        type="submit"
                        disabled={(phone.Value || '') === input}
                        loading={submitting}
                        data-testid="account:recovery:phoneSubmit"
                    >
                        {c('Action').t`Save`}
                    </Button>
                </div>
            </form>
        </>
    );
};

export default RecoveryPhone;
