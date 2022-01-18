import { Icon, InlineLinkButton, useApi } from '@proton/components';
import { sendMetricsReport } from '@proton/shared/lib/api/metrics';
import { c } from 'ttag';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { MessageState } from '../../../logic/messages/messagesTypes';
import { removeDarkStyle } from '../../../logic/messages/read/messagesReadActions';

interface Props {
    message: MessageState;
}

const LOG_ID = 'dark_styles';

const ExtraDarkStyle = ({ message }: Props) => {
    const dispatch = useDispatch();
    const api = useApi();
    const showBanner = message.messageDocument?.hasDarkStyle && !message.messageDocument?.noDarkStyle;

    useEffect(() => {
        if (showBanner) {
            void api(
                sendMetricsReport({ Log: LOG_ID, Title: 'Apply dark styles', Data: { action: 'apply-dark-styles' } })
            );
        }
    }, [showBanner]);

    if (!showBanner) {
        return null;
    }

    const handleClick = () => {
        dispatch(removeDarkStyle({ ID: message.localID, noDarkStyle: true }));
        void api(
            sendMetricsReport({ Log: LOG_ID, Title: 'Remove dark styles', Data: { action: 'remove-dark-styles' } })
        );
    };

    return (
        <div className="bg-norm rounded border p0-5 mb0-5 flex flex-nowrap">
            <Icon name="color" className="flex-item-noshrink mtauto mbauto" />
            <span className="pl0-5 pr0-5 flex-item-fluid">{c('Info')
                .t`This message has been adjusted to comply with a dark background.`}</span>
            <span className="flex-item-noshrink flex">
                <InlineLinkButton
                    onClick={handleClick}
                    className="text-underline"
                    data-testid="message-view:remove-dark-style"
                >{c('Action').t`Revert to original display`}</InlineLinkButton>
            </span>
        </div>
    );
};

export default ExtraDarkStyle;
