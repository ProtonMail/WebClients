import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import {
    $createTextNode,
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    COMMAND_PRIORITY_NORMAL,
    KEY_ARROW_DOWN_COMMAND,
    KEY_ARROW_UP_COMMAND,
    KEY_ENTER_COMMAND,
    KEY_ESCAPE_COMMAND,
    KEY_TAB_COMMAND,
} from 'lexical';

import { getMentionToken } from '@proton/meet/utils/mentions/mentionToken';

import { useMentionLabels } from '../../../hooks/useMentionLabels';
import { useMentionSuggestionList } from '../../../hooks/useMentionSuggestionList';
import { $getStoredLength } from '../../../utils/mentions/mentionLength';
import type { MentionSuggestion } from '../../../utils/mentions/mentionSuggestions';
import { filterMentionSuggestions } from '../../../utils/mentions/mentionSuggestions';
import { MentionSuggestions } from '../../MentionSuggestions/MentionSuggestions';
import { $createMentionNode, $isMentionNode } from '../MentionNode';

const MAX_MENTION_QUERY_LENGTH = 75;

const MENTION_TRIGGER_REGEX = new RegExp(`(?:^|\\s)@([^\\s][^\\n]{0,${MAX_MENTION_QUERY_LENGTH}}|)$`);

interface ActiveMention {
    query: string;
    /** Offset of the `@` within its text node. */
    start: number;
}

/** Must be called inside `editor.read`/`editor.update`. */
const $findMentionTrigger = (): ActiveMention | null => {
    const selection = $getSelection();

    if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
        return null;
    }

    const { anchor } = selection;
    const node = anchor.getNode();

    // A mention that is already committed is an atomic token, never a query.
    if (!$isTextNode(node) || $isMentionNode(node)) {
        return null;
    }

    const textBeforeCaret = node.getTextContent().slice(0, anchor.offset);
    const match = MENTION_TRIGGER_REGEX.exec(textBeforeCaret);

    if (match === null) {
        return null;
    }

    const [, query] = match;

    return { query, start: anchor.offset - (query.length + 1) };
};

interface Props {
    listId: string;
    anchorEl: HTMLElement | null;
    maxLength: number;
    getOptionId: (index: number) => string;
    onSuggestionCountChange: (count: number) => void;
    onActiveIndexChange: (index: number) => void;
    onMentionTooLong: () => void;
}

export const MentionsTypeaheadPlugin = ({
    listId,
    anchorEl,
    maxLength,
    getOptionId,
    onSuggestionCountChange,
    onActiveIndexChange,
    onMentionTooLong,
}: Props) => {
    const [editor] = useLexicalComposerContext();

    const [activeMention, setActiveMention] = useState<ActiveMention | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);

    const allSuggestions = useMentionSuggestionList();
    const getMentionLabel = useMentionLabels();

    const suggestions = useMemo(
        () => (activeMention === null ? [] : filterMentionSuggestions(allSuggestions, activeMention.query)),
        [allSuggestions, activeMention]
    );

    const isOpen = suggestions.length > 0;

    // Command handlers are registered once, so they read live state through refs.
    const stateRef = useRef({ suggestions, activeIndex, activeMention });
    stateRef.current = { suggestions, activeIndex, activeMention };

    const isListOpen = useCallback(() => stateRef.current.suggestions.length > 0, []);

    useEffect(() => onSuggestionCountChange(suggestions.length), [suggestions.length, onSuggestionCountChange]);

    useEffect(() => onActiveIndexChange(activeIndex), [activeIndex, onActiveIndexChange]);

    const close = useCallback(() => setActiveMention(null), []);

    const selectSuggestion = useCallback(
        (suggestion: MentionSuggestion) => {
            const { activeMention: mention } = stateRef.current;

            if (!mention) {
                return;
            }

            // Check length before the deferred update; @query becomes token + trailing space.
            const projectedLength =
                editor.getEditorState().read($getStoredLength) -
                (mention.query.length + 1) +
                getMentionToken(suggestion.id).length +
                1;

            // Reject here to avoid truncating a token mid-string later.
            if (projectedLength > maxLength) {
                close();
                onMentionTooLong();

                return;
            }

            editor.update(() => {
                const selection = $getSelection();

                if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
                    return;
                }

                const { anchor } = selection;
                const node = anchor.getNode();

                if (!$isTextNode(node)) {
                    return;
                }

                const { name, className } = getMentionLabel(suggestion.id);
                const mentionNode = $createMentionNode(suggestion.id, `@${name}`, className);

                const parts = node.splitText(mention.start, anchor.offset);
                const target = mention.start === 0 ? parts[0] : parts[1];

                if (!target) {
                    return;
                }

                target.replace(mentionNode);

                // Trailing space lands the caret outside the token.
                const trailingSpace = $createTextNode(' ');

                mentionNode.insertAfter(trailingSpace);
                trailingSpace.selectEnd();
            });

            close();
        },
        [close, editor, getMentionLabel, maxLength, onMentionTooLong]
    );

    const moveActiveIndex = useCallback((delta: number) => {
        const { suggestions: current, activeIndex: index } = stateRef.current;

        if (current.length === 0) {
            return;
        }

        setActiveIndex((index + delta + current.length) % current.length);
    }, []);

    const selectActiveSuggestion = useCallback(() => {
        const { suggestions: current, activeIndex: index } = stateRef.current;
        const suggestion = current[index];

        if (suggestion) {
            selectSuggestion(suggestion);
        }
    }, [selectSuggestion]);

    useEffect(
        () =>
            editor.registerUpdateListener(({ editorState }) => {
                const next = editorState.read($findMentionTrigger);

                setActiveMention((previous) => {
                    if (previous?.query === next?.query && previous?.start === next?.start) {
                        return previous;
                    }

                    setActiveIndex(0);

                    return next;
                });
            }),
        [editor]
    );

    useEffect(
        () =>
            mergeRegister(
                editor.registerCommand(
                    KEY_ARROW_DOWN_COMMAND,
                    (event) => {
                        if (!isListOpen()) {
                            return false;
                        }

                        event?.preventDefault();
                        moveActiveIndex(1);

                        return true;
                    },
                    COMMAND_PRIORITY_NORMAL
                ),
                editor.registerCommand(
                    KEY_ARROW_UP_COMMAND,
                    (event) => {
                        if (!isListOpen()) {
                            return false;
                        }

                        event?.preventDefault();
                        moveActiveIndex(-1);

                        return true;
                    },
                    COMMAND_PRIORITY_NORMAL
                ),
                editor.registerCommand(
                    KEY_ENTER_COMMAND,
                    (event) => {
                        if (!isListOpen() || event?.shiftKey) {
                            return false;
                        }

                        event?.preventDefault();
                        selectActiveSuggestion();

                        return true;
                    },
                    // Above the send handler so an open list takes Enter first.
                    COMMAND_PRIORITY_NORMAL
                ),
                editor.registerCommand(
                    KEY_TAB_COMMAND,
                    (event) => {
                        if (!isListOpen()) {
                            return false;
                        }

                        event?.preventDefault();
                        selectActiveSuggestion();

                        return true;
                    },
                    COMMAND_PRIORITY_NORMAL
                ),
                editor.registerCommand(
                    KEY_ESCAPE_COMMAND,
                    (event) => {
                        if (!isListOpen()) {
                            return false;
                        }

                        event?.stopPropagation();
                        close();

                        return true;
                    },
                    COMMAND_PRIORITY_NORMAL
                )
            ),
        [close, editor, isListOpen, moveActiveIndex, selectActiveSuggestion]
    );

    return (
        <MentionSuggestions
            id={listId}
            isOpen={isOpen}
            anchorEl={anchorEl}
            suggestions={suggestions}
            activeIndex={activeIndex}
            getOptionId={getOptionId}
            onSelect={selectSuggestion}
        />
    );
};
