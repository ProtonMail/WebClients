import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ModalTwo, ModalTwoContent } from '@proton/components';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import { isFirefox } from '@proton/shared/lib/helpers/browser';
import warningIcon from '@proton/styles/assets/img/meet/warning-icon.png';
import clsx from '@proton/utils/clsx';

import './WebRtcUnsupportedModal.scss';

interface WebRtcUnsupportedModalProps {
    onClose: () => void;
}

export const WebRtcUnsupportedModal = ({ onClose }: WebRtcUnsupportedModalProps) => {
    const firefox = isFirefox();

    return (
        <ModalTwo
            open={true}
            rootClassName="web-rtc-unsupported-modal-backdrop"
            className={clsx(
                firefox ? 'web-rtc-unsupported-modal-firefox' : 'web-rtc-unsupported-modal',
                'border border-norm'
            )}
        >
            <ModalTwoContent className="web-rtc-unsupported-modal-content flex flex-column gap-4">
                <div className="flex flex-column gap-4">
                    <img
                        className="mx-auto w-custom h-custom"
                        src={warningIcon}
                        alt=""
                        style={{ '--w-custom': '7.5rem', '--h-custom': '7.5rem' }}
                    />
                    <div className="text-3xl text-semibold">{c('Info').t`Your browser or device isn’t supported`}</div>
                    <span className="flex gap-4 color-weak">
                        <div>
                            {c('Info')
                                .t`${MEET_APP_NAME} needs WebRTC to run. Please update your browser or device to a version that supports WebRTC, try a different browser, or disable any extensions that might be blocking it.`}
                        </div>
                        {isFirefox() && (
                            <>
                                <div>{c('Info').t`If you’re using Firefox, make sure PeerConnection is enabled.`}</div>
                                <div>
                                    {c('Info')
                                        .t`Go to about:config, search for media.peerconnection.enabled, and set it to true.`}
                                </div>
                            </>
                        )}
                    </span>
                    <Button
                        className="close-web-rtc-unsupported-modal-button rounded-full border-none mt-5 py-4 w-full"
                        onClick={onClose}
                        size="large"
                    >
                        Close
                    </Button>
                </div>
            </ModalTwoContent>
        </ModalTwo>
    );
};
