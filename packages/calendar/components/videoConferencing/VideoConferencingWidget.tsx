import React, { useState } from 'react';

import { c } from 'ttag';

import { ButtonLike, Href } from '@proton/atoms';
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
import { IcVideoCamera } from '@proton/icons';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import type { BaseMeetingUrls } from './constants';

import './VideoConferencing.scss';

export type VideoConferenceLocation = 'calendar' | 'mail-headers';

// todo remove location is not required in the end.
interface Props {
    location: VideoConferenceLocation;
    data: BaseMeetingUrls;
}

const EventDetailsRow = ({
    prefix,
    suffix,
    copySuccessText,
}: {
    prefix: string;
    suffix: string;
    copySuccessText: string;
}) => {
    const { createNotification } = useNotifications();
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        textToClipboard(suffix);
        createNotification({ text: copySuccessText });
    };

    return (
        <button type="button" className="flex flex-col gap-1" onClick={handleClick}>
            <p className="m-0">{prefix}</p>
            <p className="m-0 text-ellipsis color-weak max-w-full" title={suffix}>
                {suffix}
            </p>
        </button>
    );
};

// TODO change the color of the dropdown header text to norm when hovering
// TODO clicking anywhere should expend the dropdown
export const VideoConferencingWidget = ({ data }: Props) => {
    const { createNotification } = useNotifications();
    const [isExpanded, setIsExpanded] = useState(false);

    const { meetingUrl, meetingId, joiningInstructions, password, service, meetingHost } = data;
    if (!meetingUrl) {
        return null;
    }

    const hasOnlyLink = meetingUrl && !joiningInstructions && !meetingId && !password;
    const joinText = service === 'zoom' ? c('Zoom Meeting').t`Join Zoom meeting` : c('Google Meet').t`Join Google Meet`;

    return (
        <IconRow icon={<IcVideoCamera />} className="items-center w-full video-conferencing-widget cursor-pointer">
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/prefer-tag-over-role */}
            <div
                role="button"
                tabIndex={0}
                aria-label={c('Action').t`Expand video conferencing widget`}
                aria-expanded={isExpanded}
                className="group-hover-opacity-container"
                onClick={() => setIsExpanded((prev) => !prev)}
            >
                <div className={clsx('flex flex-col items-center justify-space-between', !hasOnlyLink && 'mb-2')}>
                    <ButtonLike as={Href} href={meetingUrl} shape="solid" color="norm">
                        {joinText}
                    </ButtonLike>
                    <Copy
                        value={meetingUrl}
                        shape="ghost"
                        className="group-hover:opacity-100 color-weak"
                        onCopy={() => {
                            createNotification({
                                text: c('Notification').t`Link copied to clipboard`,
                            });
                        }}
                    />
                </div>
                {meetingId && (
                    <EventDetailsRow
                        prefix={c('Zoom Meeting').t`Meeting ID:`}
                        suffix={meetingId}
                        copySuccessText={c('Notification').t`Meeting ID copied to clipboard`}
                    />
                )}
                {password && (
                    <EventDetailsRow
                        prefix={c('Zoom Meeting').t`Passcode:`}
                        suffix={password}
                        copySuccessText={c('Notification').t`Passcode copied to clipboard`}
                    />
                )}
                {!hasOnlyLink && (
                    <Collapsible className="mt-2" expandByDefault={isExpanded} externallyControlled>
                        <CollapsibleHeader
                            disableFullWidth
                            suffix={
                                <CollapsibleHeaderIconButton
                                    size="small"
                                    shape="ghost"
                                    onClick={() => setIsExpanded((prev) => !prev)}
                                >
                                    <Icon name="chevron-down" />
                                </CollapsibleHeaderIconButton>
                            }
                            onClick={() => setIsExpanded((prev) => !prev)}
                            className="collapsible-header-hover-color"
                        >
                            <button type="button" className="m-0" onClick={() => setIsExpanded((prev) => !prev)}>
                                {isExpanded ? c('Google Meet').t`Less details` : c('Google Meet').t`More details`}
                            </button>
                        </CollapsibleHeader>
                        <CollapsibleContent onClick={(e) => e.stopPropagation()}>
                            <section className="mt-2">
                                <div>
                                    <p className="m-0">{c('Google Meet').t`Meeting link:`}</p>
                                    <Href className="block mb-2 text-ellipsis max-w-full" href={meetingUrl}>
                                        {meetingUrl}
                                    </Href>
                                </div>
                                {meetingHost && (
                                    <div>
                                        <p className="m-0">{c('Google Meet').t`Meeting host:`}</p>
                                        <Href
                                            className="block mb-2 text-ellipsis max-w-full"
                                            href={`mailto:${meetingHost}`}
                                        >
                                            {meetingHost}
                                        </Href>
                                    </div>
                                )}

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
