import { c, msgid } from 'ttag';
import {
    Button,
    classnames,
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Href,
    Icon,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useMailSettings,
} from '@proton/components';
import PreventTrackingToggle from '@proton/components/containers/emailPrivacy/PreventTrackingToggle';

import { emailTrackerProtectionURL } from '../../../constants';
import NumberOfElementsBubble from './NumberOfElementsBubble';
import { Tracker, useMessageTrackers } from '../../../hooks/message/useMessageTrackers';
import { MessageState } from '../../../logic/messages/messagesTypes';

interface Props extends ModalProps {
    message: MessageState;
}

const SpyTrackerModal = ({ message, ...rest }: Props) => {
    const [mailSettings] = useMailSettings();

    const { onClose } = rest;

    const { hasProtection, numberOfTrackers, needsMoreProtection, title, modalText, trackers } = useMessageTrackers({
        message,
    });

    const getHeaderContent = (tracker: Tracker) => {
        return (
            <div className="flex flex-align-items-center">
                <div className="flex-item-fluid text-break">{tracker.name}</div>
                <NumberOfElementsBubble
                    numberOfElements={tracker.urls.length}
                    className="flex-item-noshrink"
                    data-testid="privacy:icon-number-of-trackers"
                    aria-label={c('Info').ngettext(
                        msgid`${numberOfTrackers} email tracker blocked`,
                        `${numberOfTrackers} email trackers blocked`,
                        numberOfTrackers
                    )}
                />
            </div>
        );
    };

    const learnMoreLink = <Href url={emailTrackerProtectionURL}>{c('Info').t`Learn more`}</Href>;

    let content;
    let testID;
    let footerText;

    if (needsMoreProtection) {
        content = (
            <>
                {modalText}
                <div>{learnMoreLink}</div>
                <div className="mt1">
                    <PreventTrackingToggle
                        id="preventTrackingToggle"
                        preventTracking={mailSettings?.ImageProxy || 0}
                        data-testid="privacy:prevent-tracking-toggle"
                    />
                    <span className="ml0-5">{c('Action').t`Turn on tracker protection`}</span>
                </div>
            </>
        );

        testID = 'spyTrackerModal:needsMoreProtection';

        footerText = c('Action').t`OK`;
    } else if (hasProtection && numberOfTrackers === 0) {
        content = (
            <>
                {modalText}
                <div>{learnMoreLink}</div>
            </>
        );

        testID = 'spyTrackerModal:noTrackers';

        footerText = c('Action').t`Got it`;
    } else {
        content = (
            <>
                {modalText}
                <div className="mb1">{learnMoreLink}</div>
                {trackers.map((tracker, index) => {
                    return (
                        <Collapsible
                            key={tracker.name}
                            className={classnames(['border-bottom border-weak', index === 0 && 'border-top'])}
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
                                        className="color-weak text-break mb0-5 mt0-5"
                                        key={`${tracker.name}-${index}-tracker`} // eslint-disable-line react/no-array-index-key
                                    >
                                        {url}
                                    </p>
                                ))}
                            </CollapsibleContent>
                        </Collapsible>
                    );
                })}
            </>
        );

        testID = 'spyTrackerModal:trackers';

        footerText = c('Action').t`Got it`;
    }

    return (
        <ModalTwo data-testid={testID} {...rest}>
            <ModalTwoHeader title={title} />
            <ModalTwoContent>{content}</ModalTwoContent>
            <ModalTwoFooter>
                <Button className="mlauto" color="norm" onClick={onClose}>
                    {footerText}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default SpyTrackerModal;
