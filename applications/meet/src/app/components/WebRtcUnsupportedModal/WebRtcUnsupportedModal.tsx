import { c } from 'ttag';

import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import { isFirefox, isMobile } from '@proton/shared/lib/helpers/browser';
import warningIcon from '@proton/styles/assets/img/meet/warning-icon.svg';

import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';

interface WebRtcUnsupportedModalProps {
    onClose: () => void;
}

const getFirefoxPeerConnectionMessage = () => {
    const configPage = <strong key="config-page">about:config</strong>;
    const preference = <strong key="preference">media.peerconnection.enabled</strong>;
    const value = <strong key="value">true</strong>;

    // translator: full sentence is "In Firefox, open about:config and set media.peerconnection.enabled to true." where "about:config", "media.peerconnection.enabled" and "true" are bold and stay in English, as Firefox shows them
    return c('Info').jt`In Firefox, open ${configPage} and set ${preference} to ${value}.`;
};

export const WebRtcUnsupportedModal = ({ onClose }: WebRtcUnsupportedModalProps) => {
    return (
        <ConfirmationModal
            icon={
                <img
                    className="mx-auto w-custom h-custom"
                    src={warningIcon}
                    alt=""
                    style={
                        isMobile()
                            ? {
                                  '--w-custom': '3rem',
                                  '--h-custom': '3rem',
                              }
                            : {
                                  '--w-custom': '5rem',
                                  '--h-custom': '5rem',
                              }
                    }
                />
            }
            title={c('Title').t`Browser not supported`}
            message={
                <>
                    <p className="m-0">
                        {c('Info')
                            .t`${MEET_APP_NAME} needs WebRTC, which is off or blocked in this browser. Turn it on, turn off extensions that block it, or use another browser.`}
                    </p>
                    {isFirefox() && <p className="mt-2 mb-0">{getFirefoxPeerConnectionMessage()}</p>}
                </>
            }
            primaryText={c('Action').t`Close`}
            primaryButtonClass="secondary"
            onPrimaryAction={onClose}
            onClose={onClose}
            showCloseButton={false}
        />
    );
};
