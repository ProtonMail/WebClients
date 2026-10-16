import { useEffect } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TextNode } from 'lexical';

import {
    type LumoEmojiSegment,
    getLumoEmojiToken,
    splitTextIntoLumoEmojiSegments,
} from '../../../utils/lumoEmojis/lumoEmojis';
import { $createLumoEmojiNode } from '../LumoEmojiNode';

const getSegmentLength = (segment: LumoEmojiSegment) =>
    segment.type === 'text' ? segment.text.length : getLumoEmojiToken(segment.id).length;

const $replaceLumoEmojiTokensWithNodes = (textNode: TextNode) => {
    const segments = splitTextIntoLumoEmojiSegments(textNode.getTextContent());

    if (segments.every((segment) => segment.type === 'text')) {
        return;
    }

    const segmentEnds: number[] = [];
    let segmentEnd = 0;

    for (const segment of segments) {
        segmentEnd += getSegmentLength(segment);
        segmentEnds.push(segmentEnd);
    }

    const parts = textNode.splitText(...segmentEnds);

    segments.forEach((segment, index) => {
        if (segment.type === 'lumoEmoji') {
            parts[index].replace($createLumoEmojiNode(segment.id));
        }
    });
};

export const LumoEmojiPlugin = () => {
    const [editor] = useLexicalComposerContext();

    useEffect(() => editor.registerNodeTransform(TextNode, $replaceLumoEmojiTokensWithNodes), [editor]);

    return null;
};
