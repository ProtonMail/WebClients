import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectInvalidMeetingLinkModalOpen, setInvalidMeetingLinkModalOpen } from '@proton/meet/store/slices';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import invalidLinkIcon from '@proton/styles/assets/img/meet/invalid-link.svg';

import { ConfirmationModal } from '../ConfirmationModal/ConfirmationModal';

export const InvalidMeetingLinkModal = () => {
    const dispatch = useMeetDispatch();
    const history = useHistory();
    const open = useMeetSelector(selectInvalidMeetingLinkModalOpen);

    if (!open) {
        return null;
    }

    const close = () => dispatch(setInvalidMeetingLinkModalOpen(false));

    return (
        <ConfirmationModal
            icon={
                <img
                    className="mx-auto w-custom h-custom"
                    src={invalidLinkIcon}
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
            title={c('Title').t`Invalid meeting link`}
            message={c('Info')
                .t`The meeting link you tried to open doesn't exist or may have expired. Make sure the link is correct, or start a new secure meeting instead.`}
            primaryText={c('Action').t`Start new meeting`}
            onPrimaryAction={() => {
                close();
                history.push({ pathname: '/join' });
            }}
            secondaryText={c('Action').t`Close`}
            onSecondaryAction={close}
            onClose={close}
        />
    );
};
