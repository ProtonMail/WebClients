import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { updateEmail } from '@proton/shared/lib/api/settings';
import { emailValidator } from '@proton/shared/lib/helpers/formValidators';
import { SETTINGS_STATUS, UserSettings } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import { Icon, InputFieldTwo, useFormErrors, useModalState } from '../../../components';
import { useEventManager, useNotifications } from '../../../hooks';
import AuthModal from '../../password/AuthModal';
import ConfirmRemoveEmailModal from './ConfirmRemoveEmailModal';
import VerifyRecoveryEmailModal from './VerifyRecoveryEmailModal';

interface Props {
    email: UserSettings['Email'];
    hasReset: boolean;
    hasNotify: boolean;
    className?: string;
}

const RecoveryEmail = ({ email, hasReset, hasNotify, className }: Props) => {
    const [input, setInput] = useState(email.Value || '');
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const { validator, onFormSubmit } = useFormErrors();
    const [verifyRecoveryEmailModal, setVerifyRecoveryEmailModalOpen, renderVerifyRecoveryEmailModal] = useModalState();
    const [authModal, setAuthModal, renderAuthModal] = useModalState();
    const [confirmModal, setConfirmModal, renderConfirmModal] = useModalState();

    const loading = renderVerifyRecoveryEmailModal || renderConfirmModal || renderAuthModal;
    const confirmStep = !input && (hasReset || hasNotify);

    return (
        <>
            {renderAuthModal && (
                <AuthModal
                    {...authModal}
                    onCancel={undefined}
                    onSuccess={async () => {
                        await call();
                        createNotification({ text: c('Success').t`Email updated` });
                    }}
                    config={updateEmail({ Email: input })}
                />
            )}
            {renderConfirmModal && (
                <ConfirmRemoveEmailModal
                    hasReset={hasReset}
                    hasNotify={hasNotify}
                    {...confirmModal}
                    onConfirm={() => {
                        setAuthModal(true);
                    }}
                />
            )}
            {renderVerifyRecoveryEmailModal && <VerifyRecoveryEmailModal email={email} {...verifyRecoveryEmailModal} />}
            <form
                className={clsx(['flex flex-wrap on-mobile-flex-column', className])}
                onSubmit={(e) => {
                    e.preventDefault();
                    if (!onFormSubmit()) {
                        return;
                    }
                    if (confirmStep) {
                        setConfirmModal(true);
                    } else {
                        setAuthModal(true);
                    }
                }}
            >
                <div className="mr-0 mb-4 md:mr-4 flex-item-fluid min-w14e" title={email.Value || ''}>
                    <InputFieldTwo
                        type="email"
                        autoComplete="email"
                        id="recovery-email-input"
                        disableChange={loading}
                        value={input || ''}
                        error={validator([input && emailValidator(input)].filter(isTruthy))}
                        onValue={setInput}
                        assistiveText={
                            email.Value &&
                            (email.Status !== SETTINGS_STATUS.VERIFIED ? (
                                <>
                                    <Icon
                                        className="color-danger flex-item-noshrink aligntop mr-1"
                                        name="exclamation-circle-filled"
                                    />
                                    <span className="color-norm mr-2">{c('Recovery Email')
                                        .t`Email address not yet verified.`}</span>
                                    <button
                                        className="link"
                                        type="button"
                                        onClick={() => setVerifyRecoveryEmailModalOpen(true)}
                                        aria-label={c('Recovery Email')
                                            .t`Verify now this recovery email address: ${email.Value}`}
                                    >
                                        {c('Recovery Email').t`Verify now`}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Icon
                                        className="color-success flex-item-noshrink aligntop mr-1"
                                        name="checkmark-circle-filled"
                                    />
                                    <span className="mr-2">{c('Recovery Email')
                                        .t`Email address has been verified.`}</span>
                                </>
                            ))
                        }
                    />
                </div>
                <div className="mb-2">
                    <Button
                        type="submit"
                        shape="outline"
                        disabled={(email.Value || '') === input}
                        loading={loading}
                        data-testid="account:recovery:emailSubmit"
                    >
                        {c('Action').t`Save`}
                    </Button>
                </div>
            </form>
        </>
    );
};

export default RecoveryEmail;
