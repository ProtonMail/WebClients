import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon, Tooltip, useApi } from '@proton/components';
import { METRICS_LOG } from '@proton/shared/lib/constants';
import { sendMetricsReport } from '@proton/shared/lib/helpers/metrics';

import { MessageStateWithData } from '../../../logic/messages/messagesTypes';
import { removeDarkStyle } from '../../../logic/messages/read/messagesReadActions';
import { useAppDispatch } from '../../../logic/store';

interface Props {
    message: MessageStateWithData;
}

const ExtraDarkStyle = ({ message }: Props) => {
    const dispatch = useAppDispatch();
    const api = useApi();
    const showBanner = message.messageDocument?.hasDarkStyle && !message.messageDocument?.noDarkStyle;

    useEffect(() => {
        if (showBanner) {
            void sendMetricsReport(api, METRICS_LOG.DARK_STYLES, 'update_dark_styles', { action: 'apply_dark_styles' });
        }
    }, [showBanner]);

    if (!showBanner) {
        return null;
    }

    const handleClick = () => {
        dispatch(removeDarkStyle({ ID: message.localID, noDarkStyle: true }));
        void sendMetricsReport(api, METRICS_LOG.DARK_STYLES, 'update_dark_styles', { action: 'remove_dark_styles' });
    };

    return (
        <Tooltip title={c('Info').t`This message has been adjusted to comply with a dark background.`}>
            <Button
                onClick={handleClick}
                data-testid="message-view:remove-dark-style"
                className="inline-flex items-center w-full md:w-auto justify-center md:justify-start mr-0 md:mr-2 mb-3 px-2"
            >
                <Icon name="circle-half-filled" className="flex-item-noshrink ml-1" />
                <span className="ml-2">{c('Action').t`Revert to original display`}</span>
            </Button>
        </Tooltip>
    );
};

export default ExtraDarkStyle;
