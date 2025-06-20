import { clsx } from 'clsx';
import { c } from 'ttag';

import type { MeetChatMessage, MeetingRoomUpdate, ParticipantEventRecord } from '../../types';
import { ParticipantEvent } from '../../types';

import './ChatItem.scss';

interface ChatItemProps {
    roomName?: string;
    item: MeetingRoomUpdate;
    colorClassName: string;
    displayDate?: boolean;
    shouldGrow?: boolean;
}

const isMeetChatMessage = (item: MeetingRoomUpdate): item is MeetChatMessage => {
    return item.type === 'message';
};

const isParticipantEventRecord = (item: MeetingRoomUpdate): item is ParticipantEventRecord => {
    return item.type === 'event';
};

export const ChatItem = ({ roomName, item, colorClassName, displayDate = true, shouldGrow = false }: ChatItemProps) => {
    const { type, name, timestamp } = item;

    return (
        <div
            key={`${type}-${name}-${timestamp}`}
            className={clsx('flex gap-2 height-custom flex-nowrap shrink-0', shouldGrow && 'flex-1')}
            style={{ '--height-custom': 'fit-content' }}
        >
            <div className="flex flex-nowrap items-start shrink-0">
                <div
                    className={clsx(
                        colorClassName,
                        'color-invert rounded-full flex items-center justify-center w-custom h-custom'
                    )}
                    style={{ '--w-custom': '2.5rem', '--h-custom': '2.5rem' }}
                >
                    <div>
                        {name
                            ?.split(' ')
                            .map((part) => part[0].toLocaleUpperCase())
                            .slice(0, 2)
                            .join('')}
                    </div>
                </div>
            </div>

            <div className="flex flex-column flex-nowrap gap-1 justify-start">
                <div className="flex items-start text-semibold">
                    <span>{name}</span>
                    {displayDate && (
                        <div className="ml-1 color-weak">
                            {new Date(timestamp).toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                            })}
                        </div>
                    )}
                </div>
                {isMeetChatMessage(item) && (
                    <div className={clsx('flex justify-start items-start color-weak text-semibold', 'chat-message')}>
                        {item.message}
                    </div>
                )}
                {isParticipantEventRecord(item) && (
                    <div className="flex justify-start items-start text-semibold">
                        <span className="color-weak">
                            {item.eventType === ParticipantEvent.Join
                                ? c('l10n_nightly Info').t`Joined`
                                : c('l10n_nightly Info').t`Left`}
                        </span>

                        <span className="ml-1" style={{ color: 'var(--interaction-norm)' }}>
                            {roomName}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
