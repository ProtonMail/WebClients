import { useEffect, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcHourglass } from '@proton/icons/icons/IcHourglass';
import type { ToolName as ServerToolName } from '@proton/lumo-api-client';
import {
    Chip,
    ConfirmCardShell,
    LumoLogo,
    LumoThinking,
    NoteLine,
    PromptInput,
    ServerToolChip,
    renderReplyMarkdown,
    sentenceValue,
} from '@proton/lumo-ui';
import type { WelcomeSuggestionCard } from '@proton/lumo-ui/WelcomeSuggestions';
import WelcomeSuggestions from '@proton/lumo-ui/WelcomeSuggestions';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import ResultTile from './ResultTile';
import ConfirmCard, { defaultCardRenderer } from './cardRenderers';
import type { CardRenderers, LumoAgentItem, ServerToolMeta, ToolLimit } from './types';
import { ConfirmStatus } from './types';

interface Props {
    items: LumoAgentItem[];
    isBusy: boolean;
    /** Set while the chain has run out of tool rounds and waits on the user to say whether to carry on. */
    toolLimit: ToolLimit | null;
    cardRenderers?: CardRenderers;
    serverToolMeta?: Partial<Record<ServerToolName, ServerToolMeta>>;
    /** Empty-state cards. Absent for a product that wants none (e.g. Drive's file preview). */
    suggestions?: WelcomeSuggestionCard[];
    thinkingLabel?: string;
    placeholder?: string;
    onSend: (text: string) => void;
    /** Runs before the card's prompt is sent, so the host can attribute that send to the card. */
    onSuggestionPicked?: (cardId: string) => void;
    onStop: () => void;
    onClose?: () => void;
    onConfirm: (params: Record<string, any>) => void;
    onCancel: () => void;
    onResume: () => void;
    onDismissToolLimit: () => void;
}

const toolLimitSentence = (steps: number) => {
    const count = sentenceValue(c('Info').ngettext(msgid`${steps} step`, `${steps} steps`, steps));

    // translator: how many tool calls the assistant has made before pausing to ask, e.g. "Lumo has taken 10 steps so far. Keep going?"
    return c('Info').jt`${LUMO_SHORT_APP_NAME} has taken ${count} so far. Keep going?`;
};

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
    toolLimit,
    cardRenderers,
    serverToolMeta,
    suggestions,
    thinkingLabel,
    placeholder,
    onSend,
    onSuggestionPicked,
    onStop,
    onClose,
    onConfirm,
    onCancel,
    onResume,
    onDismissToolLimit,
}: Props) => {
    const [draft, setDraft] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const isFollowingBottomRef = useRef(true);
    const lastScrollTopRef = useRef(0);

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

    const resume = () => {
        followBottom();
        onResume();
    };

    const pending = items.find((item) => item.kind === 'confirm' && item.status === ConfirmStatus.PENDING);

    const isGenerating = isBusy && !pending;

    const submit = () => {
        const text = draft.trim();
        if (!text || isGenerating) {
            return;
        }
        setDraft('');
        followBottom();
        onSend(text);
    };

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

            {pending?.kind === 'confirm' ? (
                <ConfirmCard
                    renderer={cardRenderers?.[pending.action.type] ?? defaultCardRenderer}
                    action={pending.action}
                    labels={pending.labels}
                    onApply={onConfirm}
                    onCancel={onCancel}
                />
            ) : null}

            {toolLimit ? (
                <ConfirmCardShell
                    icon={IcHourglass}
                    sentence={toolLimitSentence(toolLimit.steps)}
                    note={toolLimit.activity ? <NoteLine>{toolLimit.activity}</NoteLine> : null}
                    applyLabel={c('Action').t`Keep going`}
                    cancelLabel={c('Action').t`Stop here`}
                    onApply={resume}
                    onCancel={onDismissToolLimit}
                />
            ) : null}

            <div className="lumo-agent-composer shrink-0">
                <PromptInput
                    value={draft}
                    onChange={setDraft}
                    onSubmit={submit}
                    onStop={onStop}
                    onClose={onClose}
                    isGenerating={isGenerating}
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
};

export default LumoAgentPanel;
