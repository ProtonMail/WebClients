import { useEffect, useRef } from 'react';

import { useLinkHandler } from '@proton/components/hooks/useLinkHandler';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import type { ToolName as ServerToolName } from '@proton/lumo-api-client';
import { Chip, LumoLogo, LumoThinking, ServerToolChip, renderReplyMarkdown } from '@proton/lumo-ui';
import type { WelcomeSuggestionCard } from '@proton/lumo-ui/WelcomeSuggestions';
import WelcomeSuggestions from '@proton/lumo-ui/WelcomeSuggestions';

import LumoAgentPromptBar from './LumoAgentPromptBar';
import ResultTile from './ResultTile';
import ConfirmCard, { defaultCardRenderer } from './cardRenderers';
import { findPendingConfirm, isAgentGenerating } from './pendingConfirm';
import type { CardRenderers, LumoAgentItem, ServerToolMeta } from './types';
import { ConfirmStatus } from './types';

interface Props {
    items: LumoAgentItem[];
    isBusy: boolean;
    cardRenderers?: CardRenderers;
    serverToolMeta?: Partial<Record<ServerToolName, ServerToolMeta>>;
    /** Empty-state cards. Absent for a product that wants none (e.g. Drive's file preview). */
    suggestions?: WelcomeSuggestionCard[];
    thinkingLabel?: string;
    placeholder?: string;
    /** Off for a host that renders the prompt outside the panel. */
    showPromptInput?: boolean;
    draft: string;
    onDraftChange: (draft: string) => void;
    onSend: (text: string) => void;
    /** Runs before the card's prompt is sent, so the host can attribute that send to the card. */
    onSuggestionPicked?: (cardId: string) => void;
    onStop: () => void;
    onClose?: () => void;
    onConfirm: (params: Record<string, any>) => void;
    onCancel: () => void;
}

const BOTTOM_SNAP_THRESHOLD_PX = 32;
const SUBPIXEL_TOLERANCE_PX = 1;

/**
 * The generic transcript + composer. It renders the hook's item stream and pins the single pending
 * confirm card above the composer; every visual element comes from `@proton/lumo-ui`, and the
 * product-specific bits (card bodies, server-tool wording) arrive as props. It holds no engine state.
 */
const LumoAgentPanel = ({
    items,
    isBusy,
    cardRenderers,
    serverToolMeta,
    suggestions,
    thinkingLabel,
    placeholder,
    showPromptInput = true,
    draft,
    onDraftChange,
    onSend,
    onSuggestionPicked,
    onStop,
    onClose,
    onConfirm,
    onCancel,
}: Props) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const isFollowingBottomRef = useRef(true);
    const lastScrollTopRef = useRef(0);
    // Model-authored links always confirm: no mail settings, so the email ConfirmLink choice never applies,
    // and isOutside hides the modal's "Don't ask again", which would write that email setting.
    const { modal: linkConfirmationModal } = useLinkHandler(scrollRef, undefined, { isOutside: true });

    useEffect(() => {
        if (items.length === 0 || !isFollowingBottomRef.current) {
            return;
        }
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [items, isBusy]);

    // Direction rather than distance decides detaching: a small trackpad nudge stays inside any
    // threshold, and the next streamed token would yank it straight back down. A scroll that lands
    // exactly on the bottom never detaches, because that is the browser clamping scrollTop after the
    // transcript grows or its content shrinks.
    const trackFollowingBottom = () => {
        const transcript = scrollRef.current;
        if (!transcript) {
            return;
        }
        const scrolledUp = transcript.scrollTop < lastScrollTopRef.current;
        lastScrollTopRef.current = transcript.scrollTop;
        const distanceFromBottom = transcript.scrollHeight - transcript.scrollTop - transcript.clientHeight;
        if (scrolledUp && distanceFromBottom > SUBPIXEL_TOLERANCE_PX) {
            isFollowingBottomRef.current = false;
            return;
        }
        if (distanceFromBottom <= BOTTOM_SNAP_THRESHOLD_PX) {
            isFollowingBottomRef.current = true;
        }
    };

    const followBottom = () => {
        isFollowingBottomRef.current = true;
    };

    const pickSuggestion = (prompt: string, cardId: string) => {
        followBottom();
        onSuggestionPicked?.(cardId);
        onSend(prompt);
    };

    const sendPrompt = (text: string) => {
        followBottom();
        onSend(text);
    };

    const pending = findPendingConfirm(items);
    const isGenerating = isAgentGenerating(items, isBusy);

    const renderItem = (item: LumoAgentItem) => {
        switch (item.kind) {
            case 'user':
                return (
                    <div key={item.id} className="lumo-agent-bubble is-user">
                        {item.text}
                    </div>
                );
            case 'reply':
                return (
                    <div
                        key={item.id}
                        className="lumo-agent-reply"
                        dangerouslySetInnerHTML={{ __html: renderReplyMarkdown(item.text) }}
                    />
                );
            case 'chip':
                return <Chip key={item.id} label={item.label} payload={item.payload} className="lumo-agent-tool-row" />;
            case 'servertool': {
                const meta = serverToolMeta?.[item.tool];
                return (
                    <ServerToolChip
                        key={item.id}
                        label={meta?.label() ?? item.tool}
                        icon={meta?.icon ?? IcGlobe}
                        sources={item.sources}
                        className="lumo-agent-tool-row"
                    />
                );
            }
            case 'confirm':
                if (item.status === ConfirmStatus.PENDING) {
                    return null; // pinned above the composer instead
                }
                return (
                    <ResultTile
                        key={item.id}
                        renderer={cardRenderers?.[item.action.type] ?? defaultCardRenderer}
                        action={item.action}
                        labels={item.labels}
                        status={item.status}
                        className="lumo-agent-tool-row"
                    />
                );
            case 'error':
                return (
                    <div key={item.id} className="lumo-agent-error">
                        {item.message}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="lumo-agent-panel">
            <div ref={scrollRef} className="lumo-agent-transcript" onScroll={trackFollowingBottom}>
                {suggestions && items.length === 0 && (
                    <WelcomeSuggestions cards={suggestions} onPick={pickSuggestion} />
                )}
                {items.map(renderItem)}
                {isGenerating && <LumoThinking label={thinkingLabel} />}
                {/* Idle Lumo mark beneath the latest turn, once a conversation exists (like lumo.proton.me). */}
                {!isGenerating && items.length > 0 && <LumoLogo className="lumo-agent-avatar" />}
            </div>
            {linkConfirmationModal}

            {pending?.kind === 'confirm' ? (
                <ConfirmCard
                    renderer={cardRenderers?.[pending.action.type] ?? defaultCardRenderer}
                    action={pending.action}
                    labels={pending.labels}
                    onApply={onConfirm}
                    onCancel={onCancel}
                />
            ) : null}

            {showPromptInput && (
                <div className="lumo-agent-composer shrink-0">
                    <LumoAgentPromptBar
                        draft={draft}
                        onDraftChange={onDraftChange}
                        isGenerating={isGenerating}
                        onSend={sendPrompt}
                        onStop={onStop}
                        onClose={onClose}
                        placeholder={placeholder}
                    />
                </div>
            )}
        </div>
    );
};

export default LumoAgentPanel;
