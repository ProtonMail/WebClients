import { c, msgid } from 'ttag';

import { Href } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
} from '@proton/components';
import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import trackersImg from '@proton/styles/assets/img/illustrations/trackers-found.svg';
import clsx from '@proton/utils/clsx';

import { emailTrackerProtectionURL } from '../../../constants';
import type { Tracker } from '../../../hooks/message/useMessageTrackers';
import { useMessageTrackers } from '../../../hooks/message/useMessageTrackers';
import NumberOfElementsBubble from './NumberOfElementsBubble';

interface Props extends ModalProps {
    message: MessageState;
}

const SpyTrackerModal = ({ message, ...rest }: Props) => {
    const { numberOfImageTrackers: trackersCount, imageTrackerText, imageTrackers } = useMessageTrackers(message);

    const getHeaderContent = (tracker: Tracker) => {
        return (
            <div className="flex items-center">
                <div className="flex-1 text-break">{tracker.name}</div>
                <NumberOfElementsBubble
                    numberOfElements={tracker.urls.length}
                    className="shrink-0"
                    data-testid="privacy:icon-number-of-trackers"
                    aria-label={c('Info').ngettext(
                        msgid`${trackersCount} email tracker blocked`,
                        `${trackersCount} email trackers blocked`,
                        trackersCount
                    )}
                />
            </div>
        );
    };

    const learnMoreLink = (
        <Href href={emailTrackerProtectionURL} data-testid="trackersModal:learn-more">{c('Info').t`Learn more`}</Href>
    );

    return (
        <ModalTwo data-testid="spyTrackerModal:trackers" {...rest}>
            <ModalTwoHeader title={imageTrackerText} data-testid="trackersModal:title" />
            <ModalTwoContent>
                <div className="border rounded-lg mb-4 p-4 flex flex-nowrap items-center">
                    <img src={trackersImg} alt={imageTrackerText} className="shrink-0" />
                    <p className="color-weak flex-1 pl-4 my-0" data-testid="trackersModal:description">
                        {c('Info')
                            .t`We blocked the following advertisers and organizations from seeing when you open this email, what device you’re using, and where you’re located.`}
                        <br />
                        <span>{learnMoreLink}</span>
                    </p>
                </div>

                {imageTrackers.map((tracker, index) => {
                    return (
                        <Collapsible
                            key={tracker.name}
                            className={clsx(['border-bottom border-weak', index === 0 && 'border-top'])}
                        >
                            <CollapsibleHeader
                                suffix={
                                    <CollapsibleHeaderIconButton
                                        expandText={c('Action').t`Expand URL`}
                                        collapseText={c('Action').t`Collapse URL`}
                                    >
                                        <Icon name="chevron-down" />
                                    </CollapsibleHeaderIconButton>
                                }
                            >
                                {getHeaderContent(tracker)}
                            </CollapsibleHeader>
                            <CollapsibleContent>
                                {tracker.urls.map((url, index) => (
                                    <p
                                        className="color-weak text-break my-2"
                                        key={`${tracker.name}-${index}-tracker`} // eslint-disable-line react/no-array-index-key
                                    >
                                        {url}
                                    </p>
                                ))}
                            </CollapsibleContent>
                        </Collapsible>
                    );
                })}
            </ModalTwoContent>
            <ModalTwoFooter />
        </ModalTwo>
    );
};

export default SpyTrackerModal;
