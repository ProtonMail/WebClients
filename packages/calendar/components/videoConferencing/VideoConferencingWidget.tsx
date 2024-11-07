import React, { useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike, Href } from '@proton/atoms';
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
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import clsx from '@proton/utils/clsx';

import type { BaseMeetingUrls } from './constants';

import './VideoConferencing.scss';

export type VideoConferenceLocation = 'event-details' | 'event-form';

interface Props {
    location: VideoConferenceLocation;
    data: BaseMeetingUrls;
    handleDelete?: () => void;
}

const EventDetailsRow = ({
    prefix,
    suffix,
    copySuccessText,
    linkMode,
}: {
    prefix: string;
    suffix: string;
    copySuccessText: string;
    linkMode?: boolean;
}) => {
    const { createNotification } = useNotifications();
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();

        textToClipboard(suffix);
        createNotification({ text: copySuccessText });
    };

    if (linkMode) {
        return (
            <div className="flex flex-column items-start mb-2">
                <p className="m-0">{prefix}</p>
                <Button
                    shape="underline"
                    color="norm"
                    size="small"
                    className="p-0 block text-ellipsis max-w-full"
                    onClick={handleClick}
                >
                    {suffix}
                </Button>
            </div>
        );
    }

    return (
        <button type="button" className="flex gap-1" onClick={handleClick}>
            <p className="m-0">{prefix}</p>
            <p className="m-0 text-ellipsis color-weak max-w-full" title={suffix}>
                {suffix}
            </p>
        </button>
    );
};

export const VideoConferencingWidget = ({ data, location, handleDelete }: Props) => {
    const { createNotification } = useNotifications();
    const [isExpanded, setIsExpanded] = useState(false);

    const { meetingUrl, meetingId, joiningInstructions, password, service, meetingHost } = data;
    if (!meetingUrl) {
        return null;
    }

    const hasOnlyLink = meetingUrl && !joiningInstructions && !meetingId && !password;
    const joinText = service === 'zoom' ? c('Zoom Meeting').t`Join Zoom meeting` : c('Google Meet').t`Join Google Meet`;

    return (
        <IconRow
            icon={<IcVideoCamera />}
            containerClassName="grow"
            className="items-center w-full video-conferencing-widget cursor-pointer"
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
                aria-label={c('Action').t`Expand video conferencing widget`}
                aria-expanded={isExpanded}
                className="group-hover-opacity-container"
                onClick={() => setIsExpanded((prev) => !prev)}
            >
                <div className={clsx('flex flex-col items-center justify-space-between', !hasOnlyLink && 'mb-2')}>
                    <ButtonLike as={Href} href={meetingUrl} shape="solid" color="norm">
                        {joinText}
                    </ButtonLike>

                    <div className="flex gap-2">
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
                        {location === 'event-form' && (
                            <Button icon shape="ghost" size="small" onClick={handleDelete}>
                                <Icon name="cross-big" alt={c('Action').t`Remove zoom meeting`} />
                            </Button>
                        )}
                    </div>
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
                                {meetingHost && validateEmailAddress(meetingHost) && (
                                    <EventDetailsRow
                                        linkMode
                                        prefix={c('Google Meet').t`Meeting host:`}
                                        suffix={meetingHost}
                                        copySuccessText={c('Notification').t`Meeting host copied to clipboard`}
                                    />
                                )}

                                <div>
                                    <p className="m-0">{c('Google Meet').t`Meeting link:`}</p>
                                    <Href className="block mb-2 text-ellipsis max-w-full" href={meetingUrl}>
                                        {meetingUrl}
                                    </Href>
                                </div>

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
