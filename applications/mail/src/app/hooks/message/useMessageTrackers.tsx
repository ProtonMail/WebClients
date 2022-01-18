import { classnames, Collapsible, ConfirmModal, Href, useMailSettings, useModals } from '@proton/components';
import { IMAGE_PROXY_FLAGS, SHOW_IMAGES } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { c, msgid } from 'ttag';
import React, { useEffect, useState } from 'react';
import PreventTrackingToggle from '@proton/components/containers/emailPrivacy/PreventTrackingToggle';
import { MessageState } from '../../logic/messages/messagesTypes';
import { emailTrackerProtectionURL } from '../../constants';
import NumberOfElementsBubble from '../../components/list/spy-tracker/NumberOfElementsBubble';

interface Tracker {
    name: string;
    urls: string[];
}

const getTrackers = (message: MessageState) => {
    const trackersImages = message.messageImages?.images.filter((image) => {
        return image.tracker;
    });

    const trackers: Tracker[] = [];
    trackersImages?.forEach((trackerImage) => {
        const elExists = trackers.findIndex((tracker) => tracker.name === trackerImage.tracker);

        let url = '';
        if ('cloc' in trackerImage) {
            url = trackerImage.cloc;
        } else if ('originalURL' in trackerImage) {
            url = trackerImage.originalURL || '';
        }

        if (elExists < 0) {
            trackers.push({ name: trackerImage.tracker || '', urls: [url] });
        } else {
            const alreadyContainsURL = trackers[elExists].urls.includes(url);
            if (!alreadyContainsURL) {
                trackers[elExists] = { ...trackers[elExists], urls: [...trackers[elExists].urls, url] };
            }
        }
    });

    const numberOfTrackers = trackers.reduce((acc, tracker) => {
        return acc + tracker.urls.length;
    }, 0);

    return { trackers, numberOfTrackers };
};

interface Props {
    message: MessageState;
    isDetails?: boolean;
}

export const useMessageTrackers = ({ message, isDetails = false }: Props) => {
    const [mailSettings] = useMailSettings();
    const { createModal } = useModals();
    const [title, setTitle] = useState<string>('');
    const [modalText, setModalText] = useState<string>('');

    const hasProtection = (mailSettings?.ImageProxy ? mailSettings.ImageProxy : 0) > IMAGE_PROXY_FLAGS.NONE;
    const hasShowImage = hasBit(mailSettings?.ShowImages ? mailSettings.ShowImages : 0, SHOW_IMAGES.REMOTE);

    const { trackers, numberOfTrackers } = getTrackers(message);

    /*
     * If email protection is OFF and we do not load the image automatically, the user is aware about the need of protection.
     * From our side, we want to inform him that he can also turn on protection mode in the settings.
     */
    const needsMoreProtection = !hasProtection && !hasShowImage;

    useEffect(() => {
        let title;
        let modalText;

        if (needsMoreProtection) {
            title = c('Info').t`Email tracker protection is disabled`;
            modalText = c('Info')
                .t`Email trackers can violate your privacy. Turn on tracker protection to prevent senders from knowing whether and when you have opened a message.`;
        } else if (hasProtection && numberOfTrackers === 0) {
            title = c('Info').t`No email trackers found`;
            modalText = c('Info')
                .t`Email trackers can violate your privacy. Proton did not find any trackers on this message.`;
        } else {
            title = c('Info').ngettext(
                msgid`${numberOfTrackers} email tracker blocked`,
                `${numberOfTrackers} email trackers blocked`,
                numberOfTrackers
            );
            modalText = c('Info').ngettext(
                msgid`Email trackers can violate your privacy. Proton found and blocked ${numberOfTrackers} tracker.`,
                `Email trackers can violate your privacy. Proton found and blocked ${numberOfTrackers} trackers.`,
                numberOfTrackers
            );
        }

        setTitle(title);
        setModalText(modalText);
    }, [numberOfTrackers, needsMoreProtection, hasProtection, isDetails]);

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

    const openSpyTrackerModal = () => {
        const learnMoreLink = <Href url={emailTrackerProtectionURL}>{c('Info').t`Learn more`}</Href>;

        if (needsMoreProtection) {
            createModal(
                <ConfirmModal title={title} confirm={c('Action').t`OK`} cancel={null} small={false}>
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
                </ConfirmModal>
            );
        } else if (hasProtection && numberOfTrackers === 0) {
            createModal(
                <ConfirmModal title={title} confirm={c('Action').t`Got it`} cancel={null} small={false}>
                    {modalText}
                    <div>{learnMoreLink}</div>
                </ConfirmModal>
            );
        } else {
            createModal(
                <ConfirmModal title={title} confirm={c('Action').t`Got it`} cancel={null} small={false}>
                    {modalText}
                    <div className="mb1">{learnMoreLink}</div>
                    {trackers.map((tracker, index) => {
                        return (
                            <Collapsible
                                headerContent={getHeaderContent(tracker)}
                                defaultIsExpanded={false}
                                key={tracker.name}
                                className={classnames(['border-bottom border-weak', index === 0 && 'border-top'])}
                                openText={c('Action').t`Expand URL`}
                            >
                                {tracker.urls.map((url, index) => (
                                    <p
                                        className="color-weak text-break mb0-5 mt0-5"
                                        key={`${tracker.name}-${index}-tracker`} // eslint-disable-line react/no-array-index-key
                                    >
                                        {url}
                                    </p>
                                ))}
                            </Collapsible>
                        );
                    })}
                </ConfirmModal>
            );
        }
    };

    return { hasProtection, hasShowImage, numberOfTrackers, needsMoreProtection, title, openSpyTrackerModal };
};
