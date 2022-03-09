import { useState } from 'react';
import { c } from 'ttag';
import { updateEmail } from '@proton/shared/lib/api/settings';
import { emailValidator } from '@proton/shared/lib/helpers/formValidators';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { SETTINGS_STATUS, UserSettings } from '@proton/shared/lib/interfaces';

import { Button, Icon, InputFieldTwo, useFormErrors, useModalState } from '../../../components';
import { useEventManager, useLoading, useModals, useNotifications } from '../../../hooks';
import { classnames } from '../../../helpers';
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
    const [submitting, withSubmitting] = useLoading();
    const { createNotification } = useNotifications();
    const { createModal } = useModals();
    const { call } = useEventManager();
    const { validator, onFormSubmit } = useFormErrors();
    const [verifyRecoveryEmailModal, setVerifyRecoveryEmailModalOpen, renderVerifyRecoveryEmailModal] = useModalState();

    const handleSubmit = async () => {
        const confirmStep = !input && (hasReset || hasNotify);
        if (confirmStep) {
            await new Promise<void>((resolve, reject) => {
                createModal(
                    <ConfirmRemoveEmailModal
                        hasReset={hasReset}
                        hasNotify={hasNotify}
                        onClose={reject}
                        onConfirm={resolve}
                    />
                );
            });
        }

        await new Promise((resolve, reject) => {
            createModal(<AuthModal onClose={reject} onSuccess={resolve} config={updateEmail({ Email: input })} />);
        });

        await call();

        createNotification({ text: c('Success').t`Email updated` });
    };

    return (
        <>
            {renderVerifyRecoveryEmailModal && <VerifyRecoveryEmailModal email={email} {...verifyRecoveryEmailModal} />}
            <form
                className={classnames(['flex flex-wrap on-mobile-flex-column', className])}
                onSubmit={(e) => {
                    e.preventDefault();
                    if (onFormSubmit()) {
                        void withSubmitting(handleSubmit());
                    }
                }}
            >
                <div className="mr1 mb1 on-mobile-mr0 flex-item-fluid min-w14e" title={email.Value || ''}>
                    <InputFieldTwo
                        type="email"
                        autoComplete="email"
                        id="recovery-email-input"
                        disableChange={submitting}
                        value={input || ''}
                        placeholder={c('Info').t`Not set`}
                        error={validator([input && emailValidator(input)].filter(isTruthy))}
                        onValue={setInput}
                        assistiveText={
                            email.Value &&
                            (email.Status === SETTINGS_STATUS.UNVERIFIED ? (
                                <>
                                    <Icon className="color-danger aligntop mr0-25" name="circle-exclamation-filled" />
                                    <span className="color-norm mr0-5">{c('Recovery Email')
                                        .t`Email address not yet verified.`}</span>
                                    <button
                                        className="link"
                                        type="button"
                                        onClick={() => setVerifyRecoveryEmailModalOpen(true)}
                                    >
                                        {c('Recovery Email').t`Verify now`}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Icon className="color-success aligntop mr0-25" name="circle-check-filled" />
                                    <span className="mr0-5">{c('Recovery Email')
                                        .t`Email address has been verified.`}</span>
                                </>
                            ))
                        }
                    />
                </div>
                <div className="mb0-5">
                    <Button
                        type="submit"
                        shape="outline"
                        disabled={(email.Value || '') === input}
                        loading={submitting}
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
