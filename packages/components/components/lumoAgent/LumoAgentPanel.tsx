import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { IcHourglass } from '@proton/icons/icons/IcHourglass';
import type { ToolName as ServerToolName } from '@proton/lumo-api-client';
import {
    Chip,
    ConfirmCardShell,
    LumoLogo,
    LumoThinking,
    PromptInput,
    ServerToolChip,
    renderReplyMarkdown,
} from '@proton/lumo-ui';

import ResultTile from './ResultTile';
import ConfirmCard, { defaultCardRenderer } from './cardRenderers';
import type { CardRenderers, LumoAgentItem, ServerToolMeta } from './types';

interface Props {
    items: LumoAgentItem[];
    isBusy: boolean;
    /** The chain ran out of tool rounds and is waiting on the user to say whether it should carry on. */
    isAtToolLimit: boolean;
    cardRenderers?: CardRenderers;
    serverToolMeta?: Partial<Record<ServerToolName, ServerToolMeta>>;
    thinkingLabel?: string;
    placeholder?: string;
    onSend: (text: string) => void;
    onStop: () => void;
    onConfirm: (params: Record<string, any>) => void;
    onCancel: () => void;
    onResume: () => void;
    onDismissToolLimit: () => void;
}

/**
 * The generic transcript + composer. It renders the hook's item stream and pins the single pending
 * confirm card above the composer; every visual element comes from `@proton/lumo-ui`, and the
 * product-specific bits (card bodies, server-tool wording) arrive as props. It holds no engine state.
 */
const LumoAgentPanel = ({
    items,
    isBusy,
    isAtToolLimit,
    cardRenderers,
    serverToolMeta,
    thinkingLabel,
    placeholder,
    onSend,
    onStop,
    onConfirm,
    onCancel,
    onResume,
    onDismissToolLimit,
}: Props) => {
    const [draft, setDraft] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [items, isBusy]);

    const pending = items.find((item) => item.kind === 'confirm' && item.status === 'pending');

    const isGenerating = isBusy && !pending;

    const submit = () => {
        const text = draft.trim();
        if (!text || isGenerating) {
            return;
        }
        setDraft('');
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
                if (item.status === 'pending') {
                    return null; // pinned above the composer instead
                }
                return (
                    <ResultTile
                        key={item.id}
                        renderer={cardRenderers?.[item.action.type] ?? defaultCardRenderer}
                        action={item.action}
                        labels={item.labels}
                        status={item.status}
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
            <div ref={scrollRef} className="lumo-agent-transcript">
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

            {isAtToolLimit ? (
                <ConfirmCardShell
                    icon={IcHourglass}
                    title={c('Title').t`Still working on it`}
                    subtitle={c('Info').t`This is taking a lot of steps. Should it carry on?`}
                    applyLabel={c('Action').t`Keep going`}
                    cancelLabel={c('Action').t`Stop here`}
                    onApply={onResume}
                    onCancel={onDismissToolLimit}
                />
            ) : null}

            <div className="lumo-agent-composer shrink-0">
                <PromptInput
                    value={draft}
                    onChange={setDraft}
                    onSubmit={submit}
                    onStop={onStop}
                    isGenerating={isGenerating}
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
};

export default LumoAgentPanel;
