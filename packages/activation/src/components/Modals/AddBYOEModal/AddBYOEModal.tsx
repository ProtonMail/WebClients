import { useState } from 'react';

import { c } from 'ttag';

import SignInWithGoogle from '@proton/activation/src/components/Modals/GmailSyncModal/SignInWithGoogle';
import { Checkbox, type ModalProps, ModalTwo, ModalTwoHeader } from '@proton/components';
import { MAIL_APP_NAME, PRODUCT_NAMES } from '@proton/shared/lib/constants';
import byoeConnectGmail from '@proton/styles/assets/img/illustrations/byoe-connect-gmail.svg';
import byoeForwarding from '@proton/styles/assets/img/illustrations/byoe-forwarding.svg';
import byoeProfiling from '@proton/styles/assets/img/illustrations/byoe-profiling.svg';
import stopHandSign from '@proton/styles/assets/img/illustrations/stop-hand-sign.svg';

import './AddBYOEModal.scss';

interface Props extends Omit<ModalProps, 'onSubmit'> {
    onSubmit: (importEmails: boolean) => void;
    submitDisabled?: boolean;
    isLoading: boolean;
    expectedEmailAddress?: string;
}

const AddBYOEModal = ({ onSubmit, submitDisabled, isLoading, expectedEmailAddress, ...rest }: Props) => {
    const { onClose } = rest;

    // The checkbox is ticked by default for everyone, except when the user is converting an
    // active forwarding to a BYOE address using that same Gmail address.
    const [importEmails, setImportEmails] = useState(!expectedEmailAddress);

    return (
        <ModalTwo
            size="large"
            fullscreenOnMobile
            {...rest}
            onClose={onClose}
            className="modal-two-addbyoe"
            data-testid="EasySwitch:AddBYOEModal"
        >
            <ModalTwoHeader />
            <div className="m-8 mt-0 flex flex-column *:min-size-auto md:flex-row items-center flex-nowrap gap-7">
                <div className="flex flex-column flex-nowrap w-full lg:w-auto flex-1 gap-4">
                    <h1 className="text-break text-4xl text-wrap-balance">
                        <strong>{c('Title').t`Bring your Gmail into ${MAIL_APP_NAME}`}</strong>
                    </h1>
                    <div className="color-weak text-lg text-wrap-balance">
                        {c('Description')
                            .t`We'll import your old emails and sync new messages from Gmail going forward`}
                    </div>
                    <div className="flex flex-column items-center gap-4">
                        <SignInWithGoogle
                            onClick={() => onSubmit(importEmails)}
                            loading={isLoading}
                            disabled={submitDisabled}
                            fullWidth
                            buttonText={c('Action').t`Connect your email`}
                        />
                    </div>

                    <div className="mt-8">
                        <Checkbox
                            checked={importEmails}
                            onChange={(e) => setImportEmails(e.target.checked)}
                            className="self-start"
                            data-testid="AddBYOEModal:importCheckbox"
                        >
                            <span>{c('Label').t`Import your emails`}</span>
                        </Checkbox>
                        <div className="color-weak text-sm text-wrap-balance mt-4">
                            {c('BYOE')
                                .t`Duplicates from previous imports will be skipped. Undo or import older messages in ${PRODUCT_NAMES.EASY_SWITCH} settings.`}
                        </div>
                    </div>
                </div>
                <div className="lg:block modal-two-addbyoe-aside px-8 md:px-10 relative">
                    <p className="text-center">
                        <img src={byoeConnectGmail} alt="" className="mx-auto relative z-up" />
                    </p>
                    <div className="flex flex-row flex-nowrap items-center gap-4 border rounded-xl p-4 mb-2 modal-two-addbyoe-feature relative">
                        <img src={byoeForwarding} alt="" className="shrink-0" />
                        <div>{c('Description')
                            .t`Read, reply, and stay on top of Gmail from within ${MAIL_APP_NAME}`}</div>
                    </div>
                    <div className="flex flex-row flex-nowrap items-center gap-4 border rounded-xl p-4 mb-2 modal-two-addbyoe-feature relative">
                        <img src={stopHandSign} alt="" className="shrink-0" />
                        <div>{c('Description').t`No ads. No trackers.`}</div>
                    </div>
                    <div className="flex flex-row flex-nowrap items-center gap-4 border rounded-xl p-4 mb-2 modal-two-addbyoe-feature relative">
                        <img src={byoeProfiling} alt="" className="shrink-0" />
                        <div>{c('Description')
                            .t`Block Google's ability to profile you. Gmail can't see what you do in ${MAIL_APP_NAME}`}</div>
                    </div>
                </div>
            </div>
        </ModalTwo>
    );
};

export default AddBYOEModal;
