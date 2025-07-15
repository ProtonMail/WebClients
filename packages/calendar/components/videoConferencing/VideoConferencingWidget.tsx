import React, { type ReactNode, useState } from 'react';

import { c } from 'ttag';

import { Button, ButtonLike, Href } from '@proton/atoms';
import { Collapsible, CollapsibleContent, CollapsibleHeader, Copy, Icon, IconRow } from '@proton/components';
import useNotifications from '@proton/components/hooks/useNotifications';
import { IcVideoCamera } from '@proton/icons';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import clsx from '@proton/utils/clsx';

import type { BaseMeetingUrls } from './constants';
import { getVideoConfCopy, isVideoConfOnlyLink } from './videoConfHelpers';

import './VideoConferencing.scss';

export type VideoConferenceLocation = 'event-details' | 'event-form';

interface Props {
    location: VideoConferenceLocation;
    data: BaseMeetingUrls;
    handleDelete?: () => void;
    overrideJoinButton?: ReactNode;
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
        <button type="button" className="flex text-ellipsis max-w-full" onClick={handleClick}>
            <p className="m-0 mr-1">{prefix}</p>
            <p className="m-0 text-ellipsis color-weak max-w-full" title={suffix}>
                {suffix}
            </p>
        </button>
    );
};

export const VideoConferencingWidget = ({ data, location, handleDelete, overrideJoinButton }: Props) => {
    const { createNotification } = useNotifications();
    const [isExpanded, setIsExpanded] = useState(false);

    if (!data.meetingUrl) {
        return null;
    }

    const hasOnlyLink = isVideoConfOnlyLink(data);
    const joinText = getVideoConfCopy(data.service);

    const handleOnCopy = () => {
        createNotification({
            text: c('Notification').t`Link copied to clipboard`,
        });
    };

    const toggleExpanded = () => {
        setIsExpanded((prev) => !prev);
    };

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
                onClick={toggleExpanded}
            >
                <div className={clsx('flex flex-col items-center justify-space-between', !hasOnlyLink && 'mb-2')}>
                    {overrideJoinButton ? (
                        overrideJoinButton
                    ) : (
                        <ButtonLike as={Href} href={data.meetingUrl} shape="solid" color="norm">
                            {joinText}
                        </ButtonLike>
                    )}

                    <div className="flex gap-2">
                        <Copy
                            value={data.meetingUrl}
                            shape="ghost"
                            size="small"
                            className="group-hover:opacity-100 color-weak"
                            onCopy={handleOnCopy}
                        />
                        {location === 'event-form' && (
                            <Button icon shape="ghost" size="small" onClick={handleDelete}>
                                <Icon name="cross-big" alt={c('Action').t`Remove Zoom meeting`} />
                            </Button>
                        )}
                    </div>
                </div>
                {data.meetingId && (
                    <EventDetailsRow
                        prefix={c('Zoom Meeting').t`Meeting ID:`}
                        suffix={data.meetingId}
                        copySuccessText={c('Notification').t`Meeting ID copied to clipboard`}
                    />
                )}
                {data.password && (
                    <EventDetailsRow
                        prefix={c('Zoom Meeting').t`Passcode:`}
                        suffix={data.password}
                        copySuccessText={c('Notification').t`Passcode copied to clipboard`}
                    />
                )}
                {!hasOnlyLink && (
                    <Collapsible className="mt-2" expandByDefault={isExpanded} externallyControlled>
                        <CollapsibleHeader
                            disableFullWidth
                            onClick={toggleExpanded}
                            className="collapsible-header-hover-color"
                        >
                            <button
                                type="button"
                                className="m-0 flex gap-1 text-sm color-weak"
                                onClick={toggleExpanded}
                            >
                                {isExpanded ? c('Google Meet').t`Less details` : c('Google Meet').t`More details`}
                                <Icon name="chevron-down" className={isExpanded ? 'rotateX-180' : ''} />
                            </button>
                        </CollapsibleHeader>
                        <CollapsibleContent onClick={(e) => e.stopPropagation()}>
                            <section className="mt-2">
                                {data.meetingHost && validateEmailAddress(data.meetingHost) && (
                                    <EventDetailsRow
                                        linkMode
                                        prefix={c('Google Meet').t`Meeting host:`}
                                        suffix={data.meetingHost}
                                        copySuccessText={c('Notification').t`Meeting host copied to clipboard`}
                                    />
                                )}

                                <div>
                                    <p className="m-0">{c('Google Meet').t`Meeting link:`}</p>
                                    <Href className="block mb-2 text-ellipsis max-w-full" href={data.meetingUrl}>
                                        {data.meetingUrl}
                                    </Href>
                                </div>

                                {data.joiningInstructions && (
                                    <Href href={data.joiningInstructions}>{c('Google Meet')
                                        .t`Joining instructions`}</Href>
                                )}
                            </section>
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </div>
        </IconRow>
    );
};
