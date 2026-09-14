import type { ReactNode } from 'react';
import { useCallback, useEffect, useId, useRef, useState } from 'react';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import type { EditorState } from 'lexical';
import { $getRoot, $getSelection, $isRangeSelection } from 'lexical';
import { c, msgid } from 'ttag';

import ErrorBoundary from '@proton/components/containers/app/ErrorBoundary';
import { captureMessage } from '@proton/shared/lib/helpers/sentry';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { useMentionLabels } from '../../hooks/useMentionLabels';
import { $readMentionValue, $writeMentionValue } from '../../utils/mentions/mentionEditorState';
import { MentionNode } from './MentionNode';
import { MaxLengthPlugin } from './plugins/MaxLengthPlugin';
import { MentionLabelSyncPlugin } from './plugins/MentionLabelSyncPlugin';
import { MentionsTypeaheadPlugin } from './plugins/MentionsTypeaheadPlugin';
import { SubmitOnEnterPlugin } from './plugins/SubmitOnEnterPlugin';

import './MentionInput.scss';

// Reported, not rethrown — Lexical errors would otherwise crash the meeting UI.
const reportComposerError = (error: Error) => {
    captureMessage('Meet chat composer error', {
        level: 'error',
        // Omit message content from Sentry extras.
        extra: { errorName: error.name, errorMessage: error.message },
    });
};

const ComposerErrorFallback = () => (
    <div className="color-danger text-sm py-1">
        {c('Error').t`The message field is unavailable. Please reload the page.`}
    </div>
);

const ComposerErrorBoundary = ({ children, onError }: { children: ReactNode; onError: (error: Error) => void }) => (
    <ErrorBoundary component={<ComposerErrorFallback />} onError={onError}>
        {children}
    </ErrorBoundary>
);

/** Single source for the line height: the vertical padding and the placeholder both derive from it. */
const LINE_HEIGHT_REM = 1.5;

export interface MentionInputHandle {
    setValue: (value: string) => void;
    insertText: (text: string) => void;
    focus: () => void;
}

interface Props {
    /** Stored form with mention tokens; written once on mount. */
    initialValue: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    maxLength: number;
    onMentionTooLong: () => void;
    placeholder: string;
    ariaLabel: string;
    autoFocus?: boolean;
    className?: string;
    /** Height of the field when empty, in rem. Padding keeps the first line centred inside it. */
    minHeight: number;
    /** Height of the text area at which it starts scrolling, in rem. */
    maxHeight: number;
    suggestionAnchorEl: HTMLElement | null;
    handleRef: React.MutableRefObject<MentionInputHandle | null>;
}

const EditorBridge = ({
    handleRef,
    initialValue,
    autoFocus,
}: Pick<Props, 'handleRef' | 'initialValue' | 'autoFocus'>) => {
    const [editor] = useLexicalComposerContext();
    const getMentionLabel = useMentionLabels();

    const getMentionLabelRef = useRef(getMentionLabel);
    getMentionLabelRef.current = getMentionLabel;

    useEffect(() => {
        handleRef.current = {
            setValue: (value: string) =>
                editor.update(
                    () => {
                        $writeMentionValue(value, getMentionLabelRef.current).selectEnd();
                    },
                    // Synchronous update — callers read the value immediately after clearing.
                    { discrete: true }
                ),
            insertText: (text: string) =>
                editor.update(() => {
                    if (!$isRangeSelection($getSelection())) {
                        $getRoot().selectEnd();
                    }

                    const selection = $getSelection();

                    if ($isRangeSelection(selection)) {
                        selection.insertText(text);
                    }
                }),
            focus: () => editor.focus(),
        };

        return () => {
            handleRef.current = null;
        };
    }, [editor, handleRef]);

    // Written once on mount; the editor owns the content afterwards.
    useEffect(() => {
        if (initialValue === '') {
            return;
        }

        editor.update(() => {
            $writeMentionValue(initialValue, getMentionLabelRef.current).selectEnd();
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (autoFocus) {
            editor.focus();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null;
};

export const MentionInput = ({
    initialValue,
    onChange,
    onSubmit,
    maxLength,
    onMentionTooLong,
    placeholder,
    ariaLabel,
    autoFocus,
    className,
    minHeight,
    maxHeight,
    suggestionAnchorEl,
    handleRef,
}: Props) => {
    const isMentionsEnabled = useFlag('MeetChatMentions');

    const suggestionListId = useId();
    const getSuggestionOptionId = useCallback(
        (index: number) => `${suggestionListId}-option-${index}`,
        [suggestionListId]
    );

    const [suggestionCount, setSuggestionCount] = useState(0);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

    const isSuggestionListOpen = suggestionCount > 0;

    const [isEmpty, setIsEmpty] = useState(initialValue === '');

    // Padding rather than centring: the first line keeps its position once the text wraps and the
    // field grows downwards.
    const verticalPadding = Math.max(0, (minHeight - LINE_HEIGHT_REM) / 2);

    const handleChange = useCallback(
        (editorState: EditorState) => {
            editorState.read(() => {
                const value = $readMentionValue();

                setIsEmpty(value === '');
                onChange(value);
            });
        },
        [onChange]
    );

    return (
        <ErrorBoundary component={<ComposerErrorFallback />}>
            <LexicalComposer
                initialConfig={{
                    namespace: 'meet-chat-composer',
                    nodes: [MentionNode],
                    onError: reportComposerError,
                    theme: { paragraph: 'm-0' },
                }}
            >
                <div className={clsx('relative', className)}>
                    <PlainTextPlugin
                        contentEditable={
                            // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                            <ContentEditable
                                className="mention-input w-full overflow-y-auto outline-none--at-all"
                                style={{
                                    lineHeight: `${LINE_HEIGHT_REM}rem`,
                                    paddingBlock: `${verticalPadding}rem`,
                                    maxHeight: `${maxHeight + 2 * verticalPadding}rem`,
                                }}
                                role="combobox"
                                aria-label={ariaLabel}
                                aria-autocomplete="list"
                                aria-expanded={isSuggestionListOpen}
                                aria-controls={isSuggestionListOpen ? suggestionListId : undefined}
                                aria-activedescendant={
                                    isSuggestionListOpen ? getSuggestionOptionId(activeSuggestionIndex) : undefined
                                }
                            />
                        }
                        ErrorBoundary={ComposerErrorBoundary}
                    />
                    {isEmpty && (
                        <div
                            aria-hidden="true"
                            className="absolute top-0 start-0 color-hint text-nowrap pointer-events-none user-select-none"
                            style={{ paddingBlock: `${verticalPadding}rem`, lineHeight: `${LINE_HEIGHT_REM}rem` }}
                        >
                            {placeholder}
                        </div>
                    )}
                </div>
                {/* Stays mounted while empty: a region that appears together with its content is not announced. */}
                <span className="sr-only" aria-live="polite">
                    {isSuggestionListOpen
                        ? c('Accessibility announcement').ngettext(
                              msgid`${suggestionCount} mention suggestion available`,
                              `${suggestionCount} mention suggestions available`,
                              suggestionCount
                          )
                        : null}
                </span>
                <HistoryPlugin />
                <OnChangePlugin
                    onChange={handleChange}
                    ignoreSelectionChange={true}
                    ignoreHistoryMergeTagChange={false}
                />
                <MaxLengthPlugin maxLength={maxLength} />
                <SubmitOnEnterPlugin onSubmit={onSubmit} />
                <MentionLabelSyncPlugin />
                {isMentionsEnabled && (
                    <MentionsTypeaheadPlugin
                        listId={suggestionListId}
                        anchorEl={suggestionAnchorEl}
                        maxLength={maxLength}
                        getOptionId={getSuggestionOptionId}
                        onSuggestionCountChange={setSuggestionCount}
                        onActiveIndexChange={setActiveSuggestionIndex}
                        onMentionTooLong={onMentionTooLong}
                    />
                )}
                <EditorBridge handleRef={handleRef} initialValue={initialValue} autoFocus={autoFocus} />
            </LexicalComposer>
        </ErrorBoundary>
    );
};
