import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Href } from '@proton/atoms/Href';
import type { ModalProps } from '@proton/components/components';
import {
    Icon,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Tooltip,
} from '@proton/components/components';
import { openNewTab } from '@proton/shared/lib/helpers/browser';
import cleanLinkImg from '@proton/styles/assets/img/illustrations/clean-utm-trackers.svg';

import { emailTrackerProtectionURL } from '../../../constants';
import { useMessageTrackers } from '../../../hooks/message/useMessageTrackers';
import type { MessageState } from '../../../store/messages/messagesTypes';

interface Props extends ModalProps {
    message: MessageState;
}

const UTMTrackerModal = ({ message, ...rest }: Props) => {
    const { utmTrackerText, utmTrackers } = useMessageTrackers(message);

    const handleOpenLink = (link: string) => {
        openNewTab(link);
    };

    const learnMoreLink = (
        <Href href={emailTrackerProtectionURL} data-testid="trackersModal:learn-more">{c('Info').t`Learn more`}</Href>
    );

    return (
        <ModalTwo data-testid="utmTrackerModal:trackers" {...rest}>
            <ModalTwoHeader title={utmTrackerText} data-testid="trackersModal:title" />
            <ModalTwoContent>
                <div className="border rounded-lg mb-4 p-4 flex flex-nowrap items-center">
                    <img src={cleanLinkImg} alt="" className="shrink-0" />
                    <p className="color-weak flex-1 pl-4 my-0" data-testid="trackersModal:description">
                        {c('Info')
                            .t`We removed tracking information from the following links to help protect you from advertisers and others trying to track your online activity.`}
                        <br />
                        <span>{learnMoreLink}</span>
                    </p>
                </div>

                {utmTrackers.map((tracker) => {
                    return (
                        <div key={`${tracker.originalURL}`} className="mb-4">
                            <div className="flex flex-column mb-0.5">
                                <span className="color-weak text-sm">{c('Label').t`Original link`}</span>
                                <div
                                    className="flex flex-nowrap group-hover-opacity-container max-w-full items-center"
                                    style={{ 'margin-block': '-0.25em' }}
                                >
                                    <div className="text-ellipsis w-full flex-1 py-1" title={tracker.originalURL}>
                                        {tracker.originalURL}
                                    </div>
                                    <div className="group-hover:opacity-100 group-hover:opacity-100-no-width shrink-0 ml-0.5">
                                        <Tooltip title={c('Label').t`Open in a new tab`}>
                                            <Button
                                                icon
                                                color="weak"
                                                shape="outline"
                                                size="small"
                                                onClick={() => handleOpenLink(tracker.originalURL)}
                                            >
                                                <Icon name="arrow-out-square" alt={c('Label').t`Open in a new tab`} />
                                            </Button>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-column">
                                <span className="color-primary text-sm">{c('Label').t`Cleaned`}</span>
                                <div
                                    className="flex flex-nowrap group-hover-opacity-container max-w-full items-center"
                                    style={{ 'margin-block': '-0.25em' }}
                                >
                                    <div className="text-ellipsis w-full flex-1 py-1" title={tracker.cleanedURL}>
                                        {tracker.cleanedURL}
                                    </div>
                                    <div className="group-hover:opacity-100 group-hover:opacity-100-no-width shrink-0 ml-0.5">
                                        <Tooltip title={c('Label').t`Open in a new tab`}>
                                            <Button
                                                icon
                                                color="weak"
                                                shape="outline"
                                                size="small"
                                                onClick={() => handleOpenLink(tracker.cleanedURL)}
                                            >
                                                <Icon name="arrow-out-square" alt={c('Label').t`Open in a new tab`} />
                                            </Button>
                                        </Tooltip>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </ModalTwoContent>
            <ModalTwoFooter />
        </ModalTwo>
    );
};

export default UTMTrackerModal;
