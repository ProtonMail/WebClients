import { useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';

import type { VirtualElement } from '@floating-ui/dom';
import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Popper } from '@proton/atoms/Popper/Popper';
import { usePopper } from '@proton/atoms/Popper/usePopper';
import useFocusTrap from '@proton/components/components/focus/useFocusTrap';
import useCombinedRefs from '@proton/hooks/useCombinedRefs';
import { isMobile } from '@proton/shared/lib/helpers/browser';

import { useStableCallback } from '../../hooks/useStableCallback';
import { isImeComposing } from '../../utils/isImeComposing';
import { isSingleGrapheme } from '../../utils/isSingleGrapheme';
import { EmojiPicker } from '../EmojiPicker/EmojiPicker';

const PICKER_OFFSET = 4;

const EMOJI_PER_LINE = 8;
const MAX_EMOJI_BUTTON_SIZE = 40;
// emoji-mart adds 28px of padding and scrollbar to the grid; 1.25rem of the viewport width stays free around the
// picker, and half of it between the picker and the screen edge it opens towards.
const EMOJI_MART_GRID_PADDING = 28;
const VIEWPORT_SIDE_MARGIN = 20;
const VIEWPORT_EDGE_MARGIN = VIEWPORT_SIDE_MARGIN / 2;

const getEmojiButtonSize = () =>
    Math.min(
        MAX_EMOJI_BUTTON_SIZE,
        Math.floor((window.innerWidth - VIEWPORT_SIDE_MARGIN - EMOJI_MART_GRID_PADDING) / EMOJI_PER_LINE)
    );

// Thread replies scroll under the pinned root as well as the header, as in ChatThread.scss.
const getCoveredTopHeight = (anchor: HTMLElement) => {
    const style = getComputedStyle(anchor);
    const headerHeight = parseFloat(style.getPropertyValue('--side-bar-header-height')) || 0;
    if (!anchor.closest('.chat-thread-header--sticky + .chat-thread-body')) {
        return headerHeight;
    }
    return headerHeight + (parseFloat(style.getPropertyValue('--chat-thread-root-height')) || 0);
};

const EMOJI_MART_HEIGHT = 435;
const EMOJI_MART_MIN_HEIGHT = 230;

// Spans the chat panel horizontally at the height of the actions toolbar, so the picker centres on the panel.
const getPanelWideReference = (anchor: HTMLElement): VirtualElement => ({
    contextElement: anchor,
    getBoundingClientRect: () => {
        const anchorRect = anchor.getBoundingClientRect();
        const panelRect = anchor.closest('.message-list')?.getBoundingClientRect() ?? anchorRect;

        return {
            x: panelRect.left,
            y: anchorRect.top,
            left: panelRect.left,
            right: panelRect.right,
            top: anchorRect.top,
            bottom: anchorRect.bottom,
            width: panelRect.width,
            height: anchorRect.height,
        };
    },
});

interface ChatMessageReactionPickerProps {
    id: string;
    isOpen: boolean;
    anchorRef: RefObject<HTMLElement | null>;
    triggerRef: RefObject<HTMLElement | null>;
    onClose: (options?: { restoreFocus?: boolean }) => void;
    onReact: (emoji: string) => void;
}

export const ChatMessageReactionPicker = ({
    id,
    isOpen,
    anchorRef,
    triggerRef,
    onClose,
    onReact,
}: ChatMessageReactionPickerProps) => {
    const { createNotification } = useNotifications();
    const popperRef = useRef<HTMLDivElement>(null);

    const emojiButtonSize = useMemo(() => (isOpen ? getEmojiButtonSize() : MAX_EMOJI_BUTTON_SIZE), [isOpen]);

    // The on-screen keyboard would cover most of the picker if its search field took focus.
    const isMobileDevice = isMobile();

    const reference = useMemo(
        () => (isOpen && anchorRef.current ? getPanelWideReference(anchorRef.current) : null),
        [anchorRef, isOpen]
    );

    const { floating, position } = usePopper({
        // usePopper hands the reference to floating-ui, which takes virtual elements; its prop type only names HTMLElement.
        reference: { mode: 'element', value: reference as HTMLElement | null },
        isOpen,
        originalPlacement: 'bottom',
        availablePlacements: ['bottom', 'top'],
        availableSize: true,
        offset: PICKER_OFFSET,
    });

    useEffect(() => {
        const anchor = anchorRef.current;
        if (!isOpen || !anchor) {
            return;
        }

        const coveredTopHeight = getCoveredTopHeight(anchor);
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) {
                    onClose({ restoreFocus: popperRef.current?.contains(document.activeElement) });
                }
            },
            { root: anchor.closest('.message-list'), rootMargin: `${-coveredTopHeight}px 0px 0px 0px` }
        );
        observer.observe(anchor);

        return () => observer.disconnect();
    }, [anchorRef, isOpen, onClose]);

    const setPopperRef = useCombinedRefs<HTMLDivElement>(popperRef, floating);

    const focusTrapProps = useFocusTrap({
        rootRef: popperRef,
        active: isOpen,
        enableInitialFocus: false,
        restoreFocus: false,
        includeShadowRoots: true,
    });

    const handleEmojiSelect = useStableCallback((emoji: string) => {
        // Lumo emojis still show in search and "Frequently used": emoji-mart's `exceptEmojis` edits its shared data,
        // which would also hide them from the composer's picker.
        if (!isSingleGrapheme(emoji)) {
            createNotification({
                key: 'chat-reaction-emoji-unsupported',
                type: 'error',
                text: c('Error').t`This emoji can’t be used as a reaction`,
            });
            return;
        }

        onClose({ restoreFocus: true });
        onReact(emoji);
    });

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleClickOutside = ({ target }: MouseEvent) => {
            const node = target as Node | null;
            if (!node || popperRef.current?.contains(node) || triggerRef.current?.contains(node)) {
                return;
            }
            onClose();
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') {
                return;
            }

            // emoji-mart's search clears or blurs itself on Escape, so no Escape may reach it.
            event.stopPropagation();
            if (!isImeComposing(event)) {
                onClose({ restoreFocus: true });
            }
        };

        document.addEventListener('click', handleClickOutside, { capture: true });
        document.addEventListener('keydown', handleKeyDown, { capture: true });

        return () => {
            document.removeEventListener('click', handleClickOutside, { capture: true });
            document.removeEventListener('keydown', handleKeyDown, { capture: true });
        };
    }, [isOpen, onClose, triggerRef]);

    return (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <Popper
            id={id}
            className="chat-message-reaction-picker fixed w-fit-content h-fit-content z-up"
            divRef={setPopperRef}
            isOpen={isOpen}
            style={{
                ...position,
                '--emoji-picker-max-height': `max(${EMOJI_MART_MIN_HEIGHT}px, calc(var(--available-height, ${EMOJI_MART_HEIGHT}px) - ${VIEWPORT_EDGE_MARGIN}px))`,
            }}
            role="dialog"
            aria-label={c('Label').t`Reaction picker`}
            {...focusTrapProps}
        >
            <EmojiPicker
                autoFocus={!isMobileDevice}
                onEmojiSelect={handleEmojiSelect}
                set="native"
                skinTonePosition="none"
                previewPosition="none"
                perLine={EMOJI_PER_LINE}
                emojiButtonSize={emojiButtonSize}
                showLumoSection={false}
            />
        </Popper>
    );
};
