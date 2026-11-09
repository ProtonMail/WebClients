import { useId, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { Scroll } from '@proton/atoms/Scroll/Scroll';
import Checkbox from '@proton/components/components/input/Checkbox';
import { openDesktopSettings } from '@proton/lumo-api-client/core/desktop-tools';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import type { CreateScheduleToolArguments } from '../../../../../features/client-tools/createScheduleTool/createScheduleTool';
import { ConnectorIcon } from '../../../../../features/schedules/components/ConnectorChip';
import { isScheduleConnectorUsable } from '../../../../../features/schedules/components/utils/connectors';
import { useScheduleConnectors } from '../../../../../features/schedules/useScheduleConnectors';
import { LumoIcon } from '../../../../LumoIcon/LumoIcon';

import '../../../../../features/schedules/components/ChipList.scss';
import './AccessRequestMessage.scss';

interface AccessRequestMessageProps {
    /** Schedule draft whose requested connectors all start selected for access approval. */
    draft: CreateScheduleToolArguments;
    /** Optional display-ready message shown below the tool list. */
    note?: string;
    /** Returns selected connector IDs on Allow, or an empty set on Not now. */
    onComplete: (connectorIds: Set<string>) => void;
}

// translator: Opens setup for the selected connector. ${label} is the connector name.
const getConnectorSetupLabel = (label: string) => c('collider_2025:Action').t`Set up ${label}`;

export const AccessRequestMessage = ({ draft, note, onComplete }: AccessRequestMessageProps) => {
    const id = useId();
    const { connectors, status } = useScheduleConnectors();
    const [selectedConnectorIds, setSelectedConnectorIds] = useState(
        () => new Set(draft.connectors.map(({ id }) => id))
    );

    const { createNotification } = useNotifications();
    const openConnectorSettings = async (connectorId: string) => {
        try {
            await openDesktopSettings('connectors', connectorId);
        } catch {
            createNotification({
                type: 'error',
                text: c('collider_2025:Error').t`Could not open connector settings. Please try again.`,
            });
        }
    };

    const taskName = draft.name;
    const tools = draft.connectors.map(({ id, tools }) => {
        const manifest = connectors.find((connector) => connector.id === id);
        return {
            id,
            name: manifest?.display_name ?? id,
            tools,
            icon: manifest?.icon ?? undefined,
            unavailable: !manifest || !isScheduleConnectorUsable(manifest),
            disabled: manifest?.enabled === false && manifest?.readiness?.state === 'ready',
        };
    });

    const handleConnectorChange = (id: string, checked: boolean) => {
        setSelectedConnectorIds((selected) => {
            const next = new Set(selected);
            if (checked) next.add(id);
            else next.delete(id);
            return next;
        });
    };
    const canAllow =
        selectedConnectorIds.size === 0 ||
        (status === 'ready' && tools.every((tool) => !selectedConnectorIds.has(tool.id) || !tool.unavailable));
    const handleAllow = () => {
        if (canAllow) onComplete(selectedConnectorIds);
    };
    const handleDeny = () => onComplete(new Set());

    return (
        <section
            aria-describedby={`${id}-description`}
            aria-labelledby={`${id}-title`}
            className="access-request-card flex flex-column flex-nowrap gap-4 w-full min-w-0 p-5 rounded-xl bg-norm"
        >
            {/* Heading */}
            <div className="flex flex-nowrap shrink-0 items-center gap-2 min-w-0">
                <LumoIcon aria-hidden className="shrink-0 color-primary" name="ShieldCheck" size={18} />
                <h3 className="m-0 text-rg text-semibold text-break" id={`${id}-title`}>
                    {
                        // translator: Heading requesting tool access for a scheduled task. ${LUMO_SHORT_APP_NAME} is the product name; ${taskName} is the user-entered task name.
                        c('collider_2025:Title').t`${LUMO_SHORT_APP_NAME} needs these tools to run "${taskName}"`
                    }
                </h3>
            </div>

            {/* Connector list */}
            <Scroll className="access-request-card__body flex flex-column flex-nowrap overflow-hidden" scrollContained>
                <div className="flex flex-column flex-nowrap gap-4">
                    <p className="m-0 text-sm color-weak" id={`${id}-description`}>
                        {
                            // translator: Explains that connector checkboxes include or exclude external services from a scheduled task.
                            c('collider_2025:Info')
                                .t`Choose the connectors this task can use. Uncheck a connector to remove it from the schedule. You can change this anytime in the task's settings.`
                        }
                    </p>
                    <ul className="m-0 p-0 overflow-hidden border border-weak rounded-xl unstyled">
                        {tools.map((tool) => (
                            <li
                                className="access-request-card__tool flex flex-nowrap items-center gap-3 px-4 py-3"
                                key={tool.id}
                            >
                                <div className="access-request-card__icon flex shrink-0 items-center justify-center border border-weak rounded">
                                    <ConnectorIcon icon={tool.icon} />
                                </div>
                                <div className="flex flex-column flex-1 gap-0.5 min-w-0">
                                    <span
                                        className="access-request-card__tool-name text-rg text-break"
                                        id={`${id}-${tool.id}-name`}
                                    >
                                        {tool.name}
                                    </span>
                                    {tool.tools.length > 0 && (
                                        <span className="text-sm text-break color-weak" id={`${id}-${tool.id}-tools`}>
                                            {tool.tools.join(' · ')}
                                        </span>
                                    )}
                                </div>
                                {tool.unavailable && (
                                    <Button
                                        aria-label={getConnectorSetupLabel(tool.name)}
                                        className="schedule-chip-list__connect-button shrink-0"
                                        color="weak"
                                        onClick={() => {
                                            void openConnectorSettings(tool.id);
                                        }}
                                        shape="outline"
                                        type="button"
                                    >
                                        {tool.disabled
                                            ? c('collider_2025:Action').t`Manage`
                                            : c('collider_2025:Action').t`Connect`}
                                    </Button>
                                )}
                                <Checkbox
                                    aria-describedby={tool.tools.length > 0 ? `${id}-${tool.id}-tools` : undefined}
                                    aria-label={
                                        // translator: Checkbox that includes an external service in a scheduled task. ${tool.name} is the connector's display name.
                                        c('collider_2025:Label').t`Include ${tool.name} in this task`
                                    }
                                    checked={selectedConnectorIds.has(tool.id)}
                                    className="shrink-0"
                                    onChange={({ currentTarget }) =>
                                        handleConnectorChange(tool.id, currentTarget.checked)
                                    }
                                />
                            </li>
                        ))}
                    </ul>
                    {!canAllow && (
                        <p className="m-0 text-sm text-break color-hint">
                            {c('collider_2025:Info')
                                .t`Connect and enable the selected connectors before allowing access, or uncheck them.`}
                        </p>
                    )}
                    {note && <p className="m-0 text-sm text-break color-hint">{note}</p>}
                </div>
            </Scroll>

            {/* Buttons */}
            <div className="flex flex-wrap justify-end gap-2">
                <Button onClick={handleDeny} type="button">{
                    // translator: Defers the scheduled task's tool access request.
                    c('collider_2025:Action').t`Not now`
                }</Button>
                <Button color="norm" disabled={!canAllow} onClick={handleAllow} type="button">{
                    // translator: Grants the selected tools access for this scheduled task.
                    c('collider_2025:Action').t`Allow for this task`
                }</Button>
            </div>
        </section>
    );
};
