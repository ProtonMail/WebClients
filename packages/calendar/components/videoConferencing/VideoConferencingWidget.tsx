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
    useNotifications,
} from '@proton/components';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import googleLogo from '@proton/styles/assets/img/video-conferencing/google-meet.svg';
import zoomLogo from '@proton/styles/assets/img/video-conferencing/zoom.svg';
import clsx from '@proton/utils/clsx';

import './VideoConferencing.scss';

export type VideoConferenceLocation = 'calendar' | 'mail-headers';

interface Props {
    service: 'zoom' | 'google-meet';
    location: VideoConferenceLocation;
    meetingUrl?: string;
    meetingId?: string;
    joiningInstructions?: string;
    password?: string;
}

export const VideoConferencingWidget = ({
    service,
    meetingUrl,
    meetingId,
    joiningInstructions,
    password,
    location,
}: Props) => {
    const { createNotification } = useNotifications();
    const [isExpanded, setIsExpanded] = useState(false);
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
        <div className="video-conferencing-grid block overflow-hidden w-full mb-4">
            <div className="label inline-flex pt-1">
                <img
                    src={service === 'zoom' ? zoomLogo : googleLogo}
                    className="w-custom h-custom pt-0.5"
                    style={{ '--w-custom': '1.25rem', '--h-custom': '1.25rem' }}
                    alt=""
                />
            </div>
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
        </div>
    );
};
