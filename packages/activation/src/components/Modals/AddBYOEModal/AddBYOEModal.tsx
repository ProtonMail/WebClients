import { useState } from 'react';

import { c } from 'ttag';

import SignInWithGoogle from '@proton/activation/src/components/Modals/GmailSyncModal/SignInWithGoogle';
import { Checkbox, type ModalProps, ModalTwo, ModalTwoHeader } from '@proton/components';
import { BRAND_NAME, MAIL_APP_NAME, PRODUCT_NAMES } from '@proton/shared/lib/constants';
import byoeConnectGmail from '@proton/styles/assets/img/illustrations/byoe-connect-gmail.svg';
import byoeForwarding from '@proton/styles/assets/img/illustrations/byoe-forwarding.svg';
import byoeProfiling from '@proton/styles/assets/img/illustrations/byoe-profiling.svg';
import stopHandSign from '@proton/styles/assets/img/illustrations/stop-hand-sign.svg';

import './AddBYOEModal.scss';

interface Props extends Omit<ModalProps, 'onSubmit'> {
    onSubmit: (importRecentEmails: boolean) => void;
    submitDisabled?: boolean;
    isLoading: boolean;
    source: 'signup' | 'existingUser';
    expectedEmailAddress?: string;
}

const AddBYOEModal = ({ onSubmit, submitDisabled, isLoading, source, expectedEmailAddress, ...rest }: Props) => {
    const { onClose } = rest;

    // Do not show the import checkbox on signup or when user is converting a forwarding to a BYOE address
    const showImportCheckbox = source === 'existingUser' && !expectedEmailAddress;
    const [importRecentEmails, setImportRecentEmails] = useState(showImportCheckbox);

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
                        <strong>{c('loc_nightly: BYOE').t`Connect to Gmail, stay in ${BRAND_NAME}`}</strong>
                    </h1>
                    <div className="color-weak text-lg text-wrap-balance">{c('loc_nightly: BYOE')
                        .t`Send and receive Gmail messages through ${MAIL_APP_NAME}`}</div>
                    <div className="flex flex-column items-center gap-4">
                        <SignInWithGoogle
                            onClick={() => onSubmit(importRecentEmails)}
                            loading={isLoading}
                            disabled={submitDisabled}
                            fullWidth
                            buttonText={c('loc_nightly: BYOE').t`Connect to Gmail`}
                        />
                    </div>

                    {showImportCheckbox ? (
                        <>
                            <div className="border rounded-xl p-4">
                                <Checkbox
                                    checked={importRecentEmails}
                                    onChange={(e) => setImportRecentEmails(e.target.checked)}
                                    className="self-start"
                                    data-testid="AddBYOEModal:importCheckbox"
                                >
                                    <span>{c('Label').t`Import recent mails`}</span>
                                </Checkbox>
                            </div>
                            <div className="color-weak text-sm text-wrap-balance">
                                {c('loc_nightly: BYOE')
                                    .t`We import the last 180 days, you can import more mails later via ${PRODUCT_NAMES.EASY_SWITCH}`}
                            </div>
                        </>
                    ) : (
                        <div className="color-weak text-sm text-center text-wrap-balance">
                            {c('loc_nightly: BYOE')
                                .t`We will never use your data for profiling, advertising, or share it with third parties.`}
                        </div>
                    )}
                </div>
                <div className="lg:block modal-two-addbyoe-aside px-8 md:px-10 relative">
                    <p className="text-center">
                        <img src={byoeConnectGmail} alt="" className="mx-auto relative z-up" />
                    </p>
                    <div className="flex flex-row flex-nowrap items-center gap-4 border rounded-xl p-4 mb-2 modal-two-addbyoe-feature relative">
                        <img src={byoeForwarding} alt="" className="shrink-0" />
                        <div>{c('loc_nightly: BYOE')
                            .t`We'll bring in your latest emails and forward all incoming messages`}</div>
                    </div>
                    <div className="flex flex-row flex-nowrap items-center gap-4 border rounded-xl p-4 mb-2 modal-two-addbyoe-feature relative">
                        <img src={stopHandSign} alt="" className="shrink-0" />
                        <div>{c('loc_nightly: BYOE').t`No ads, no trackers, just privacy`}</div>
                    </div>
                    <div className="flex flex-row flex-nowrap items-center gap-4 border rounded-xl p-4 mb-2 modal-two-addbyoe-feature relative">
                        <img src={byoeProfiling} alt="" className="shrink-0" />
                        <div>{c('loc_nightly: BYOE')
                            .t`Your activity is not sent back to Gmail. This limits Google's ability to profile you`}</div>
                    </div>
                </div>
            </div>
        </ModalTwo>
    );
};

export default AddBYOEModal;
