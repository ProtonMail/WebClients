import { c } from 'ttag';

import SignInWithGoogle from '@proton/activation/src/components/Modals/GmailSyncModal/SignInWithGoogle';
import { type ModalProps, ModalTwo, ModalTwoHeader } from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import byoeConnectGmail from '@proton/styles/assets/img/illustrations/byoe-connect-gmail.svg';
import byoeForwarding from '@proton/styles/assets/img/illustrations/byoe-forwarding.svg';
import byoeProfiling from '@proton/styles/assets/img/illustrations/byoe-profiling.svg';
import stopHandSign from '@proton/styles/assets/img/illustrations/stop-hand-sign.svg';

import './AddBYOEModal.scss';

interface Props extends Omit<ModalProps, 'onSubmit'> {
    onSubmit: () => void;
    submitDisabled?: boolean;
    isLoading: boolean;
    expectedEmailAddress?: string;
}

const AddBYOEModal = ({ onSubmit, submitDisabled, isLoading, expectedEmailAddress, ...rest }: Props) => {
    const { onClose } = rest;

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
                        <strong>{c('loc_nightly: BYOE').t`Bring your Gmail into ${MAIL_APP_NAME}`}</strong>
                    </h1>
                    <div className="color-weak text-lg text-wrap-balance">{c('loc_nightly: BYOE')
                        .t`We'll bring in your old emails and connect your Gmail to ${MAIL_APP_NAME} so new messages appear automatically`}</div>
                    <div className="flex flex-column items-center gap-4">
                        <SignInWithGoogle
                            onClick={() => onSubmit()}
                            loading={isLoading}
                            disabled={submitDisabled}
                            fullWidth
                            buttonText={c('loc_nightly: BYOE').t`Connect to Gmail`}
                        />
                    </div>
                </div>
                <div className="lg:block modal-two-addbyoe-aside px-8 md:px-10 relative">
                    <p className="text-center">
                        <img src={byoeConnectGmail} alt="" className="mx-auto relative z-up" />
                    </p>
                    <div className="flex flex-row flex-nowrap items-center gap-4 border rounded-xl p-4 mb-2 modal-two-addbyoe-feature relative">
                        <img src={byoeForwarding} alt="" className="shrink-0" />
                        <div>{c('loc_nightly: BYOE')
                            .t`Read, reply, and stay on top of Gmail from within ${MAIL_APP_NAME}`}</div>
                    </div>
                    <div className="flex flex-row flex-nowrap items-center gap-4 border rounded-xl p-4 mb-2 modal-two-addbyoe-feature relative">
                        <img src={stopHandSign} alt="" className="shrink-0" />
                        <div>{c('loc_nightly: BYOE').t`No ads. No trackers.`}</div>
                    </div>
                    <div className="flex flex-row flex-nowrap items-center gap-4 border rounded-xl p-4 mb-2 modal-two-addbyoe-feature relative">
                        <img src={byoeProfiling} alt="" className="shrink-0" />
                        <div>{c('loc_nightly: BYOE')
                            .t`Block Google's ability to profile you. Gmail can't see what you do in ${MAIL_APP_NAME}`}</div>
                    </div>
                </div>
            </div>
        </ModalTwo>
    );
};

export default AddBYOEModal;
