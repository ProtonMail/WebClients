import { useEffect, useRef, useState } from 'react';

import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import type { ToolName as ServerToolName } from '@proton/lumo-api-client';
import { Chip, LumoLogo, LumoThinking, PromptInput, ServerToolChip, renderReplyMarkdown } from '@proton/lumo-ui';

import ResultTile from './ResultTile';
import ConfirmCard, { defaultCardRenderer } from './cardRenderers';
import type { CardRenderers, LumoAgentItem, ServerToolMeta } from './types';

interface Props {
    items: LumoAgentItem[];
    isBusy: boolean;
    cardRenderers?: CardRenderers;
    serverToolMeta?: Partial<Record<ServerToolName, ServerToolMeta>>;
    thinkingLabel?: string;
    placeholder?: string;
    onSend: (text: string) => void;
    onStop: () => void;
    onConfirm: (params: Record<string, any>) => void;
    onCancel: () => void;
}

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
    thinkingLabel,
    placeholder,
    onSend,
    onStop,
    onConfirm,
    onCancel,
}: Props) => {
    const [draft, setDraft] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [items, isBusy]);

    const pending = items.find((item) => item.kind === 'confirm' && item.status === 'pending');

    const submit = () => {
        const text = draft.trim();
        if (!text || isBusy) {
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
                        label={meta?.label ?? item.tool}
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
                {isBusy && <LumoThinking label={thinkingLabel} />}
                {/* Idle Lumo mark beneath the latest turn, once a conversation exists (like lumo.proton.me). */}
                {!isBusy && items.length > 0 && <LumoLogo className="lumo-agent-avatar" />}
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

            <div className="lumo-agent-composer shrink-0">
                <PromptInput
                    value={draft}
                    onChange={setDraft}
                    onSubmit={submit}
                    onStop={onStop}
                    isBusy={isBusy}
                    placeholder={placeholder}
                />
            </div>
        </div>
    );
};

export default LumoAgentPanel;
