import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import {
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    TextAreaTwo,
    Toggle,
} from '@proton/components';
import type { ModalStateProps } from '@proton/components';
import { IcCross } from '@proton/icons/icons/IcCross';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { useCustomAgents } from '../../hooks/useCustomAgents';
import { IconPicker } from '../projects/components/IconPicker';
import {
    AGENT_INSTRUCTIONS_MAX_LENGTH,
    CONVERSATION_STARTER_MAX_LENGTH,
    DEFAULT_AGENT_ICON,
    MAX_CONVERSATION_STARTERS,
    getIconFromAgentName,
} from './constants';

interface AgentModalProps extends ModalStateProps {
    /** When set, the modal edits an existing agent; otherwise it creates a new one. */
    agentId?: string;
    /** Called with the new agent id after creation. */
    onAgentCreated?: (agentId: string) => void;
}

export const AgentModal = ({ agentId, onAgentCreated, ...modalProps }: AgentModalProps) => {
    const { getAgent, createAgent, updateAgent, deleteAgent } = useCustomAgents();
    const existing = getAgent(agentId);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [instructions, setInstructions] = useState('');
    const [selectedIcon, setSelectedIcon] = useState<string>(DEFAULT_AGENT_ICON);
    const [userSelectedIcon, setUserSelectedIcon] = useState(false);
    const [hidden, setHidden] = useState(false);
    const [conversationStarters, setConversationStarters] = useState<string[]>([]);

    useEffect(() => {
        if (modalProps.open) {
            setName(existing?.name || '');
            setDescription(existing?.description || '');
            setInstructions(existing?.instructions || '');
            setSelectedIcon(existing?.icon || DEFAULT_AGENT_ICON);
            setUserSelectedIcon(!!existing?.icon);
            setHidden(!!existing?.hidden);
            setConversationStarters(existing?.conversationStarters ?? []);
        }
    }, [modalProps.open, agentId]);

    // Always render one trailing empty field so there's a row to type into, up to the max.
    const starterFields =
        conversationStarters.length < MAX_CONVERSATION_STARTERS ? [...conversationStarters, ''] : conversationStarters;

    const handleStarterChange = (index: number, value: string) => {
        setConversationStarters((prev) => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const handleStarterRemove = (index: number) => {
        setConversationStarters((prev) => prev.filter((_, i) => i !== index));
    };

    // Auto-suggest an icon from the name until the user picks one explicitly.
    useEffect(() => {
        if (!userSelectedIcon && name.trim()) {
            setSelectedIcon(getIconFromAgentName(name));
        }
    }, [name, userSelectedIcon]);

    const handleIconSelect = (icon: string) => {
        setSelectedIcon(icon);
        setUserSelectedIcon(true);
    };

    const handleClose = () => {
        modalProps.onClose?.();
    };

    const handleSave = () => {
        const draft = { name, description, instructions, icon: selectedIcon, hidden, conversationStarters };
        if (existing) {
            updateAgent(existing.id, draft);
        } else {
            const agent = createAgent(draft);
            onAgentCreated?.(agent.id);
        }
        handleClose();
    };

    const isSaveDisabled = !name.trim();
    const title = existing
        ? c('collider_2025:Title').t`Edit custom ${LUMO_SHORT_APP_NAME}`
        : c('collider_2025:Title').t`Create a custom ${LUMO_SHORT_APP_NAME}`;

    return (
        <ModalTwo {...modalProps} onClose={handleClose} size="large">
            <ModalTwoHeader
                title={title}
                subline={c('collider_2025:Subline')
                    .t`Agents turn a chat into a focused assistant with its own instructions. Pick one from the composer to start a conversation with it.`}
            />
            <ModalTwoContent>
                <div className="flex flex-column gap-4">
                    <div className="flex flex-nowrap items-center border border-weak rounded-lg p-1">
                        <IconPicker selectedIcon={selectedIcon} onSelectIcon={handleIconSelect} />
                        <InputFieldTwo
                            id="agent-name"
                            placeholder={c('collider_2025:Placeholder').t`Account recovery assistant`}
                            value={name}
                            onValue={setName}
                            maxLength={100}
                            unstyled
                            className="flex-1 unstyled-field"
                            dense
                        />
                    </div>

                    <div>
                        <label htmlFor="agent-description" className="block text-semibold text-sm color-norm mb-2">
                            {c('collider_2025:Label').t`Description (optional)`}
                        </label>
                        <InputFieldTwo
                            id="agent-description"
                            placeholder={c('collider_2025:Placeholder')
                                .t`Help with login, password and recovery issues.`}
                            value={description}
                            onValue={setDescription}
                            maxLength={120}
                            className="border border-weak rounded-lg"
                            dense
                        />
                    </div>

                    <div>
                        <label htmlFor="agent-instructions" className="block text-semibold text-sm color-norm mb-2">
                            {c('collider_2025:Label').t`Instructions`}
                        </label>
                        <TextAreaTwo
                            id="agent-instructions"
                            placeholder={c('collider_2025:Placeholder')
                                .t`Describe the role, scope, and behavior you want ${LUMO_SHORT_APP_NAME} to adopt for this agent.`}
                            value={instructions}
                            className="border border-weak rounded-lg"
                            onValue={setInstructions}
                            maxLength={AGENT_INSTRUCTIONS_MAX_LENGTH}
                            rows={10}
                        />
                    </div>

                    <div>
                        <label className="block text-semibold text-sm color-norm mb-1">
                            {c('collider_2025:Label').t`Conversation starters (optional)`}
                        </label>
                        <p className="text-sm color-weak mt-0 mb-2">
                            {c('collider_2025:Info').t`Example prompts shown when a conversation begins.`}
                        </p>
                        <div className="flex flex-column gap-2">
                            {starterFields.map((starter, index) => {
                                const isFilled = index < conversationStarters.length;
                                return (
                                    <div key={index} className="flex flex-nowrap items-center gap-2">
                                        <InputFieldTwo
                                            placeholder={c('collider_2025:Placeholder').t`Add a conversation starter`}
                                            value={starter}
                                            onValue={(value: string) => handleStarterChange(index, value)}
                                            maxLength={CONVERSATION_STARTER_MAX_LENGTH}
                                            className="border border-weak rounded-lg"
                                            dense
                                            assistContainerClassName="hidden"
                                        />
                                        <Button
                                            icon
                                            shape="ghost"
                                            size="small"
                                            className={isFilled ? 'shrink-0' : 'shrink-0 visibility-hidden'}
                                            disabled={!isFilled}
                                            onClick={() => handleStarterRemove(index)}
                                            title={c('collider_2025:Action').t`Remove`}
                                            aria-label={c('collider_2025:Action').t`Remove`}
                                        >
                                            <IcCross size={4} />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-nowrap items-center justify-space-between gap-2">
                        <label htmlFor="agent-hidden" className="flex flex-column">
                            <span className="text-semibold text-sm color-norm">
                                {c('collider_2025:Label').t`Hide from list`}
                            </span>
                            <span className="text-sm color-weak">
                                {c('collider_2025:Info')
                                    .t`Keep this agent out of the picker. It can still be opened with a shared link.`}
                            </span>
                        </label>
                        <Toggle id="agent-hidden" checked={hidden} onChange={() => setHidden((prev) => !prev)} />
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                {existing ? (
                    <Button
                        onClick={() => {
                            deleteAgent(existing.id);
                            handleClose();
                        }}
                        color="danger"
                        shape="outline"
                    >
                        {c('collider_2025:Button').t`Delete`}
                    </Button>
                ) : (
                    <Button onClick={handleClose} color="weak">
                        {c('collider_2025:Button').t`Cancel`}
                    </Button>
                )}
                <Button onClick={handleSave} color="norm" disabled={isSaveDisabled}>
                    {existing ? c('collider_2025:Button').t`Save` : c('collider_2025:Button').t`Create agent`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};
