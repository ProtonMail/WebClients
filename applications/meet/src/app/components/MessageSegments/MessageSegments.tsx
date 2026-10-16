import { Fragment, type ReactNode } from 'react';

import { type MentionSegment, splitMessageIntoMentionSegments } from '@proton/meet/utils/mentions/mentionToken';

import { addSpecialCharactersForMessageDisplay } from '../../utils/addSpecialCharactersForMessageDisplay';
import { type LumoEmojiSegment, splitTextIntoLumoEmojiSegments } from '../../utils/lumoEmojis/lumoEmojis';
import { LumoEmoji } from '../LumoEmoji/LumoEmoji';
import { Mention } from '../Mention/Mention';

interface Props {
    message: string;
    renderText?: (text: string) => ReactNode;
}

const renderTextInSpan = (text: string) => <span>{text}</span>;

export const MessageSegments = ({ message, renderText = renderTextInSpan }: Props) => {
    const segments = splitMessageIntoMentionSegments(addSpecialCharactersForMessageDisplay(message)).flatMap<
        MentionSegment | LumoEmojiSegment
    >((segment) => (segment.type === 'mention' ? [segment] : splitTextIntoLumoEmojiSegments(segment.text)));

    return (
        <>
            {segments.map((segment, index) => {
                if (segment.type === 'mention') {
                    return <Mention key={`mention-${index}`} id={segment.id} />;
                }

                if (segment.type === 'lumoEmoji') {
                    return <LumoEmoji key={`lumo-emoji-${index}`} id={segment.id} />;
                }

                return <Fragment key={`text-${index}`}>{renderText(segment.text)}</Fragment>;
            })}
        </>
    );
};
