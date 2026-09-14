import { useCallback, useEffect, useState } from 'react';
import type { RowComponentProps } from 'react-window';
import { List, useListRef } from 'react-window';

import { c } from 'ttag';

import { Popper } from '@proton/atoms/Popper/Popper';
import { usePopper } from '@proton/atoms/Popper/usePopper';
import { IcAt } from '@proton/icons/icons/IcAt';
import { rootFontSize } from '@proton/shared/lib/helpers/dom';
import clsx from '@proton/utils/clsx';

import { ParticipantAvatar } from '../../atoms/ParticipantAvatar/ParticipantAvatar';
import { EVERYONE_MENTION_COLORS } from '../../utils/mentions/mentionLabel';
import type { MentionSuggestion } from '../../utils/mentions/mentionSuggestions';

import './MentionSuggestions.scss';

const VISIBLE_SUGGESTION_COUNT = 6;
const SUGGESTION_ROW_HEIGHT_REM = 3;
const SUGGESTION_ROW_GAP_REM = 0.125;

/** Each virtualised slot carries its own trailing gap; the last one is trimmed off the list height. */
const SUGGESTION_SLOT_HEIGHT_REM = SUGGESTION_ROW_HEIGHT_REM + SUGGESTION_ROW_GAP_REM;

interface RowProps {
    suggestions: MentionSuggestion[];
    activeIndex: number;
    rowHeight: number;
    getOptionId: (index: number) => string;
    onSelect: (suggestion: MentionSuggestion) => void;
}

const SuggestionRow = ({
    index,
    style,
    ariaAttributes,
    suggestions,
    activeIndex,
    rowHeight,
    getOptionId,
    onSelect,
}: RowComponentProps<RowProps>) => {
    const suggestion = suggestions[index];

    if (!suggestion) {
        return null;
    }

    const isActive = index === activeIndex;

    return (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role, jsx-a11y/interactive-supports-focus
        <div
            aria-posinset={ariaAttributes['aria-posinset']}
            aria-setsize={ariaAttributes['aria-setsize']}
            id={getOptionId(index)}
            data-suggestion-index={index}
            role="option"
            aria-selected={isActive}
            className={clsx(
                'mention-suggestion flex flex-nowrap items-center gap-3 px-2 rounded-lg cursor-pointer',
                isActive && 'mention-suggestion--active'
            )}
            style={{ ...style, height: rowHeight }}
            // mousedown + preventDefault keeps focus in the composer.
            onMouseDown={(event) => {
                event.preventDefault();
                onSelect(suggestion);
            }}
        >
            {suggestion.isEveryone ? (
                <div
                    className={clsx(
                        'flex items-center justify-center shrink-0 rounded-full w-custom h-custom',
                        EVERYONE_MENTION_COLORS.backgroundColor,
                        EVERYONE_MENTION_COLORS.profileTextColor
                    )}
                    style={{ '--w-custom': '2rem', '--h-custom': '2rem' }}
                >
                    <IcAt size={4} />
                </div>
            ) : (
                <ParticipantAvatar
                    identity={suggestion.id}
                    participantName={suggestion.name}
                    size="2rem"
                    className="text-sm"
                />
            )}

            <span className="text-ellipsis text-left flex-1 min-w-0">
                <bdi>{suggestion.name}</bdi>
            </span>

            {suggestion.isEveryone ? (
                <span className="color-hint text-sm shrink-0">{c('Info').t`notify everyone here`}</span>
            ) : (
                isActive && <span className="mention-suggestion-shortcut text-sm shrink-0">{c('Info').t`enter`}</span>
            )}
        </div>
    );
};

interface Props {
    id: string;
    isOpen: boolean;
    anchorEl: HTMLElement | null;
    suggestions: MentionSuggestion[];
    activeIndex: number;
    getOptionId: (index: number) => string;
    onSelect: (suggestion: MentionSuggestion) => void;
}

export const MentionSuggestions = ({
    id,
    isOpen,
    anchorEl,
    suggestions,
    activeIndex,
    getOptionId,
    onSelect,
}: Props) => {
    const listRef = useListRef(null);

    const [anchorWidth, setAnchorWidth] = useState<number>();

    const { floating, position } = usePopper({
        reference: { mode: 'element', value: anchorEl },
        isOpen,
        originalPlacement: 'top-start',
        availablePlacements: ['top-start', 'bottom-start'],
        offset: 8,
    });

    useEffect(() => {
        if (isOpen && anchorEl) {
            setAnchorWidth(anchorEl.getBoundingClientRect().width);
        }
    }, [isOpen, anchorEl, suggestions.length]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        listRef.current?.scrollToRow({ index: activeIndex, align: 'auto', behavior: 'instant' });
    }, [isOpen, activeIndex, listRef]);

    // Called during render, so it has to stay referentially stable.
    const rowKey = useCallback((index: number, { suggestions: rows }: RowProps) => rows[index]?.id ?? index, []);

    // `react-window` only accepts pixel row heights, so the rem values have to be converted. The
    // conversion factor is re-read on every open, otherwise a root font size changed mid-session
    // would keep the rows at their stale height until a reload.
    const [remInPx, setRemInPx] = useState(() => rootFontSize());

    useEffect(() => {
        if (isOpen) {
            setRemInPx(rootFontSize(true));
        }
    }, [isOpen]);

    const rowHeight = SUGGESTION_ROW_HEIGHT_REM * remInPx;
    const slotHeight = SUGGESTION_SLOT_HEIGHT_REM * remInPx;
    const visibleCount = Math.min(suggestions.length, VISIBLE_SUGGESTION_COUNT);
    const listHeight = Math.max(visibleCount * slotHeight - SUGGESTION_ROW_GAP_REM * remInPx, 0);

    return (
        <Popper
            className="mention-suggestions fixed z-up rounded-xl border border-norm w-custom"
            divRef={floating}
            isOpen={isOpen}
            role="none"
            style={{ ...position, '--w-custom': anchorWidth !== undefined ? `${anchorWidth}px` : 'auto' }}
        >
            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
            <List
                id={id}
                listRef={listRef}
                // Overrides the default `list` role, making the rows below `option`s of a listbox.
                role="listbox"
                aria-label={c('Label').t`Mention a participant`}
                className="mention-suggestion-list"
                // An explicit pixel height lets the list skip resize observation entirely.
                style={{ height: listHeight }}
                rowComponent={SuggestionRow}
                rowCount={suggestions.length}
                rowHeight={slotHeight}
                rowKey={rowKey}
                rowProps={{
                    suggestions,
                    activeIndex,
                    rowHeight,
                    getOptionId,
                    onSelect,
                }}
            />
        </Popper>
    );
};
