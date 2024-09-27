import { useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Copy,
    Icon,
    IconRow,
    useNotifications,
} from '@proton/components';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import googleLogo from '@proton/styles/assets/img/video-conferencing/google-meet.svg';
import zoomLogo from '@proton/styles/assets/img/video-conferencing/zoom.svg';
import clsx from '@proton/utils/clsx';

import type { BaseMeetingUrls } from './constants';
import { VIDEO_CONF_SERVICES } from './constants';

import './VideoConferencing.scss';

export type VideoConferenceLocation = 'calendar' | 'mail-headers';

interface Props {
    location: VideoConferenceLocation;
    data: BaseMeetingUrls;
}

const getIcon = (service: VIDEO_CONF_SERVICES) => {
    switch (service) {
        case VIDEO_CONF_SERVICES.ZOOM:
            return zoomLogo;
        case VIDEO_CONF_SERVICES.GOOGLE_MEET:
            return googleLogo;
    }
};

export const VideoConferencingWidget = ({ data, location }: Props) => {
    const { createNotification } = useNotifications();
    const [isExpanded, setIsExpanded] = useState(false);

    const { meetingUrl, meetingId, joiningInstructions, password, service } = data;
    if (!meetingUrl) {
        return null;
    }

    const handlePasscodeClick = () => {
        textToClipboard(password);
        createNotification({
            text: c('Notification').t`Passcode copied to clipboard`,
        });
    };

    const hasOnlyLink = meetingUrl && !joiningInstructions && !meetingId && !password;
    const joinText = service === 'zoom' ? c('Zoom Meeting').t`Join Zoom Meeting` : c('Google Meet').t`Join Google Meet`;

    return (
        <IconRow icon={<img src={getIcon(service)} className="w-6 h-6" alt="" />} className="items-center">
            <div className="group-hover-opacity-container">
                <div
                    className={clsx(
                        'flex flex-col  items-center',
                        location === 'calendar' ? 'justify-space-between' : 'gap-3',
                        !hasOnlyLink && 'mb-2'
                    )}
                >
                    <Href href={meetingUrl}>{joinText}</Href>
                    <Copy
                        value={meetingUrl}
                        shape="ghost"
                        size="small"
                        className="group-hover:opacity-100 color-weak"
                        onCopy={() => {
                            createNotification({
                                text: c('Notification').t`Link copied to clipboard`,
                            });
                        }}
                    />
                </div>
                {password && (
                    <button
                        type="button"
                        className="m-0 mb-2 text-sm color-weak max-w-full text-ellipsis"
                        onClick={handlePasscodeClick}
                    >{c('Zoom Meeting').t`Passcode: ${password}`}</button>
                )}
                {!hasOnlyLink && (
                    <Collapsible>
                        <CollapsibleHeader
                            disableFullWidth
                            suffix={
                                <CollapsibleHeaderIconButton
                                    size="small"
                                    shape="ghost"
                                    onClick={() => setIsExpanded((prev) => !prev)}
                                >
                                    <Icon name="chevron-down-filled" className="color-weak" />
                                </CollapsibleHeaderIconButton>
                            }
                            onClick={() => setIsExpanded((prev) => !prev)}
                        >
                            <p className="m-0 text-sm color-weak">
                                {isExpanded ? c('Google Meet').t`Less details` : c('Google Meet').t`More details`}
                            </p>
                        </CollapsibleHeader>
                        <CollapsibleContent>
                            <section className="text-sm color-weak">
                                {meetingId && (
                                    <>
                                        <p className="m-0">{c('Zoom Meeting').t`Meeting ID:`}</p>
                                        <p className="m-0 mb-2 text-ellipsis max-w-full" title={meetingId}>
                                            {meetingId}
                                        </p>
                                    </>
                                )}
                                <p className="m-0">{c('Google Meet').t`Meeting link:`}</p>
                                <Href className="block mb-2 text-ellipsis max-w-full" href={meetingUrl}>
                                    {meetingUrl}
                                </Href>
                                {joiningInstructions && (
                                    <Href href={joiningInstructions}>{c('Google Meet').t`Joining instructions`}</Href>
                                )}
                            </section>
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </div>
        </IconRow>
    );
};
