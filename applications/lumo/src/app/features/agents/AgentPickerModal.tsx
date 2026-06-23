import { useMemo, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import {
    Icon,
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoHeader,
    useModalStateObject,
} from '@proton/components';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcPen } from '@proton/icons/icons/IcPen';
import { IcPlus } from '@proton/icons/icons/IcPlus';
import { IcSquares } from '@proton/icons/icons/IcSquares';
import { BRAND_NAME, LUMO_SHORT_APP_NAME} from '@proton/shared/lib/constants';

import { useConversationAgent } from '../../hooks/useConversationAgent';
import { useCustomAgents } from '../../hooks/useCustomAgents';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import { closeAgentPicker } from '../../redux/slices/composerActions';
import type { CustomAgent } from '../../redux/slices/lumoUserSettings';
import { AgentModal } from './AgentModal';
import { DEFAULT_AGENT_ICON } from './constants';
import { getAgentByline, isAgentEditable } from './registry';

interface AgentPickerModalProps {
    /** Current conversation id, if a conversation already exists. */
    conversationId?: string;
}

type AgentFilter = 'all' | 'mine' | 'default';

/**
 * Lists default (built-in) and personal agents so one can be activated for the
 * conversation. Opened from the Tools menu or the active agent badge. Also the entry
 * point for creating, editing and cloning agents.
 */
export const AgentPickerModal = ({ conversationId }: AgentPickerModalProps) => {
    const dispatch = useLumoDispatch();
    const isOpen = useLumoSelector((state) => state.composerActions.agentPickerOpen);
    const { personalAgents, protonAgents, createAgent } = useCustomAgents();
    const { activeAgentId, activateAgent } = useConversationAgent(conversationId);

    const editorModal = useModalStateObject();
    const [editorAgentId, setEditorAgentId] = useState<string | undefined>(undefined);
    const [filter, setFilter] = useState<AgentFilter>('all');
    const [search, setSearch] = useState('');

    const close = () => dispatch(closeAgentPicker());

    const handlePick = (agentId: string) => {
        activateAgent(agentId);
        close();
    };

    const openEditor = (agentId?: string) => {
        setEditorAgentId(agentId);
        editorModal.openModal(true);
    };

    // Clone any agent (typically a read-only default) into an editable personal copy, then
    // open it in the editor so the user can tailor it.
    const handleClone = (agent: CustomAgent) => {
        const copySuffix = c('collider_2025:Agent').t`(copy)`;
        const created = createAgent({
            name: `${agent.name} ${copySuffix}`,
            instructions: agent.instructions,
            description: agent.description,
            icon: agent.icon,
        });
        setFilter('mine');
        openEditor(created.id);
    };

    const filteredAgents = useMemo(() => {
        const byFilter: CustomAgent[] =
            // eslint-disable-next-line no-nested-ternary
            filter === 'mine'
                ? personalAgents
                : filter === 'default'
                  ? protonAgents
                  : [...protonAgents, ...personalAgents];
        const query = search.trim().toLowerCase();
        if (query) {
            // Searching is an explicit lookup, so hidden agents are included in results.
            return byFilter.filter(
                (agent) =>
                    agent.name.toLowerCase().includes(query) ||
                    (agent.description?.toLowerCase().includes(query) ?? false)
            );
        }
        // When browsing, hide hidden agents unless one is currently active for this conversation.
        return byFilter.filter((agent) => !agent.hidden || agent.id === activeAgentId);
    }, [filter, search, personalAgents, protonAgents, activeAgentId]);

    const tabs: { id: AgentFilter; label: string; disabled?: boolean }[] = [
        { id: 'all', label: c('collider_2025:Filter').t`All` },
        { id: 'mine', label: c('collider_2025:Filter').t`Mine` },
        { id: 'default', label: c('collider_2025:Filter').t`Built-in` },
    ];

    return (
        <>
            <ModalTwo open={isOpen} onClose={close} size="medium">
                <ModalTwoHeader title={c('collider_2025:Title').t`Custom ${LUMO_SHORT_APP_NAME}s`} />
                <ModalTwoContent>
                    <InputFieldTwo
                        placeholder={c('collider_2025:Placeholder').t`Search custom ${LUMO_SHORT_APP_NAME}`}
                        value={search}
                        onValue={setSearch}
                        dense
                    />

                    <div className="flex items-center gap-2 my-3" role="tablist">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                role="tab"
                                aria-selected={filter === tab.id}
                                disabled={tab.disabled}
                                onClick={() => setFilter(tab.id)}
                                className={clsx(
                                    'px-3 py-1 rounded-full text-sm',
                                    filter === tab.id ? 'bg-weak color-norm text-semibold' : 'color-weak',
                                    tab.disabled && 'opacity-40'
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div
                        className="overflow-y-auto overflow-x-none h-custom mb-4 min-w-0 w-full"
                        style={{ '--h-custom': '17.5rem' } as React.CSSProperties}
                    >
                        {filteredAgents.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-center px-4">
                                <p className="color-weak text-sm m-0">
                                    {c('collider_2025:Info')
                                        .t`Agents turn a chat into a focused assistant with its own instructions.`}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-column gap-1 min-w-0">
                                {filteredAgents.map((agent) => {
                                    const editable = isAgentEditable(agent);
                                    const isActive = agent.id === activeAgentId;
                                    const byline = getAgentByline(agent);
                                    const bylineFull = agent.description?.trim() || byline;
                                    return (
                                        <div
                                            key={agent.id}
                                            className="grid items-center gap-1 rounded-lg pl-2 pr-1 min-h-custom w-full max-w-full"
                                            style={
                                                {
                                                    '--min-h-custom': '3.5rem',
                                                    gridTemplateColumns: 'minmax(0, 1fr) auto',
                                                } as React.CSSProperties
                                            }
                                        >
                                            <button
                                                type="button"
                                                className="flex flex-nowrap items-center gap-2 min-w-0 overflow-hidden text-left h-full w-full interactive-pseudo-inset rounded-lg"
                                                onClick={() => handlePick(agent.id)}
                                            >
                                                <Icon
                                                    name={(agent.icon as any) || DEFAULT_AGENT_ICON}
                                                    size={4.5}
                                                    className="shrink-0"
                                                />
                                                <span className="flex flex-column flex-1 min-w-0 overflow-hidden">
                                                    <span className="flex items-center gap-1 min-w-0 overflow-hidden">
                                                        <span className="text-semibold text-ellipsis min-w-0 shrink block">
                                                            {agent.name}
                                                        </span>
                                                        {isActive && (
                                                            <span className="inline-flex items-center gap-0.5 text-xs text-semibold color-primary bg-weak rounded-full px-1.5 py-0.5 shrink-0">
                                                                <IcCheckmark size={3.5} />
                                                                {c('collider_2025:Badge').t`Selected`}
                                                            </span>
                                                        )}
                                                        {agent.source === 'published' && (
                                                            <span
                                                                className="text-xs text-semibold color-weak bg-weak rounded-full px-1 shrink-0"
                                                                title={c('collider_2025:Info')
                                                                    .t`Built-in ${BRAND_NAME} agent`}
                                                            >
                                                                {c('collider_2025:Badge').t`Built-in`}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span
                                                        className="text-sm color-weak text-ellipsis min-w-0 block w-full"
                                                        title={bylineFull.length > byline.length ? bylineFull : undefined}
                                                    >
                                                        {byline || '\u00A0'}
                                                    </span>
                                                </span>
                                            </button>

                                            {/* Action button — edit for personal agents, clone for built-in. */}
                                            <span className="flex items-center shrink-0">
                                                {editable ? (
                                                    <Button
                                                        icon
                                                        shape="ghost"
                                                        size="small"
                                                        className="shrink-0"
                                                        onClick={() => openEditor(agent.id)}
                                                        title={c('collider_2025:Action').t`Edit agent`}
                                                        aria-label={c('collider_2025:Action').t`Edit agent`}
                                                    >
                                                        <IcPen size={4} />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        icon
                                                        shape="ghost"
                                                        size="small"
                                                        className="shrink-0"
                                                        onClick={() => handleClone(agent)}
                                                        title={c('collider_2025:Action').t`Make a copy`}
                                                        aria-label={c('collider_2025:Action').t`Make a copy`}
                                                    >
                                                        <IcSquares size={4} />
                                                    </Button>
                                                )}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <Button
                        fullWidth
                        shape="outline"
                        className="flex items-center justify-center gap-2 mb-2"
                        onClick={() => openEditor(undefined)}
                    >
                        <IcPlus size={4} />
                        {c('collider_2025:Action').t`New ${LUMO_SHORT_APP_NAME}`}
                    </Button>
                </ModalTwoContent>
            </ModalTwo>

            {editorModal.render && (
                <AgentModal
                    {...editorModal.modalProps}
                    agentId={editorAgentId}
                    onAgentCreated={(agentId) => {
                        activateAgent(agentId);
                        close();
                    }}
                />
            )}
        </>
    );
};
