import { useId, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import {
    openDesktopSettings,
    supportsDesktopScheduleReadOnly,
    useDesktopManifests,
} from '@proton/lumo-api-client/core/desktop-tools';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { useLumoDispatch, useLumoSelector } from '../../../redux/hooks';
import { saveSchedule } from '../../../redux/slices/schedules';
import { SpaceType } from '../../../types';
import type { ScheduleDetails } from '../types';
import { ConnectorIcon } from './ConnectorChip';
import { SkillList } from './SkillList';
import { getConnectorStatusLabel } from './utils/connectors';

/** Task configuration remains editable while reading a run. Changes apply to future runs. */
export const ScheduleSkillsToolsPanel = ({ spaceId }: { spaceId: string }) => {
    const space = useLumoSelector((state) => state.spaces[spaceId]);
    return space?.spaceType === SpaceType.Schedule ? <ScheduleSkillsToolsPanelImpl spaceId={spaceId} /> : null;
};

const ScheduleSkillsToolsPanelImpl = ({ spaceId }: { spaceId: string }) => {
    const space = useLumoSelector((state) => state.spaces[spaceId]);
    const dispatch = useLumoDispatch();
    const { createNotification } = useNotifications();
    const { manifests, status: connectorStatus } = useDesktopManifests();

    const [expanded, setExpanded] = useState(true);
    const panelId = useId();
    const supportsReadOnly = supportsDesktopScheduleReadOnly();

    // The schedule may have been deleted while this panel was open.
    if (space?.spaceType !== SpaceType.Schedule) return null;

    const schedule = space.schedule;
    const skillRefs = schedule.skillIdsOrSubSkillRefs ?? [];
    const resourceCount = skillRefs.length + schedule.connectors.length;

    // Update only the task's resource selections through the existing schedule save path.
    const updateSchedule = (changes: Partial<Pick<ScheduleDetails, 'skillIdsOrSubSkillRefs' | 'connectors'>>) => {
        try {
            dispatch(saveSchedule(spaceId, { ...schedule, ...changes }, 'edit'));
        } catch {
            createNotification({
                type: 'error',
                // translator: Error notification when updating skills or connectors on a scheduled task fails.
                text: c('collider_2025:Error').t`Could not update this task. Reload the page and try again.`,
            });
        }
    };

    // translator: Status below a selected connector name when the connector is missing, disabled, blocked or failed to load.
    const unavailableLabel = c('collider_2025:Info').t`Connector unavailable`;
    // translator: Status below a selected connector name while desktop connector information is loading.
    const loadingLabel = c('collider_2025:Info').t`Loading connectors`;
    const permissionOptions = [
        {
            readOnly: true,
            // translator: Restricts this scheduled task's connector to tools explicitly classified as read-only.
            label: c('collider_2025:Label').t`Read only`,
        },
        {
            readOnly: false,
            // translator: Allows this scheduled task's connector to use both read and write tools.
            label: c('collider_2025:Label').t`Read and write`,
        },
    ];

    return (
        <section className="mb-4">
            {/* Expandable header and combined skill/connector count. */}
            <button
                type="button"
                className="flex items-center justify-space-between w-full gap-2 mb-2"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setExpanded(!expanded)}
            >
                <h3 className="m-0 text-rg text-semibold">
                    {
                        // translator: Collapsible heading in the scheduled task run side panel, followed by a count of selected skills and connectors.
                        c('collider_2025:Title').t`Skills & tools`
                    }{' '}
                    <span className="text-normal color-hint">{resourceCount}</span>
                </h3>
                <LumoIcon aria-hidden name={expanded ? 'ChevronDown' : 'ChevronRight'} size={16} />
            </button>
            <div id={panelId} hidden={!expanded}>
                {/* Explain how these resources apply to task runs. */}
                <p className="text-sm color-hint my-2">{
                    // translator: Description of the skills and connectors used for every scheduled task run. ${LUMO_SHORT_APP_NAME} is the product name.
                    c('collider_2025:Info').t`${LUMO_SHORT_APP_NAME} uses these every time it runs your task.`
                }</p>

                {/* Selected skills, including unavailable selections and their action menus. */}
                {!!skillRefs.length && (
                    <SkillList
                        value={skillRefs}
                        onChange={(skillIdsOrSubSkillRefs) => updateSchedule({ skillIdsOrSubSkillRefs })}
                        rows
                    />
                )}

                {/* Selected connectors with live desktop status and settings/removal actions. */}
                {schedule.connectors.map((connector) => {
                    const manifest = manifests.find(({ id }) => id === connector.id);
                    const unavailable =
                        connectorStatus === 'error' ||
                        (connectorStatus === 'ready' &&
                            (!manifest || manifest.enabled === false || manifest.readiness?.state === 'blocked'));
                    const warning = manifest?.status?.state === 'warning';
                    const label = manifest?.display_name ?? connector.label;
                    return (
                        <div key={connector.id} className="flex items-center gap-3 py-2">
                            <span className="inline-flex shrink-0 p-2 rounded bg-weak">
                                <ConnectorIcon
                                    icon={manifest?.icon ?? connector.icon}
                                    unavailable={unavailable}
                                    warning={warning}
                                />
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="text-semibold text-ellipsis">{label}</div>
                                <div className="text-sm color-weak">
                                    {unavailable
                                        ? unavailableLabel
                                        : manifest
                                          ? getConnectorStatusLabel(manifest)
                                          : loadingLabel}
                                </div>
                            </div>

                            {/* Dropdown menu for connectors. */}
                            <SimpleDropdown
                                as="button"
                                type="button"
                                hasCaret={false}
                                content={<LumoIcon aria-hidden name="Ellipsis" size={16} />}
                                aria-label={
                                    // translator: Accessible label for an actions menu in the scheduled task side panel. ${label} is the selected skill, sub-skill or connector name.
                                    c('collider_2025:Action').t`Actions for ${label}`
                                }
                            >
                                <DropdownMenu>
                                    <div className="px-4 pt-2 pb-1 text-sm color-weak">{
                                        // translator: Heading for a connector's task-specific access settings in its actions menu.
                                        c('collider_2025:Label').t`Permission`
                                    }</div>
                                    {permissionOptions.map(({ readOnly, label }) => (
                                        <DropdownMenuButton
                                            key={label}
                                            aria-pressed={(connector.readOnly === true) === readOnly}
                                            className="flex flex-nowrap items-center justify-space-between gap-3 text-left"
                                            disabled={readOnly && !supportsReadOnly}
                                            onClick={() =>
                                                updateSchedule({
                                                    connectors: schedule.connectors.map((item) =>
                                                        item.id === connector.id ? { ...item, readOnly } : item
                                                    ),
                                                })
                                            }
                                            title={
                                                readOnly && !supportsReadOnly
                                                    ? // translator: A scheduled task requires read-only tool permissions unsupported by this desktop version.
                                                      c('collider_2025:Error')
                                                          .t`Update ${LUMO_SHORT_APP_NAME} Desktop to use read-only connector access for this task.`
                                                    : undefined
                                            }
                                        >
                                            <span>{label}</span>
                                            {(connector.readOnly === true) === readOnly && (
                                                <LumoIcon
                                                    aria-hidden
                                                    className="shrink-0 color-primary"
                                                    name="Check"
                                                    size={16}
                                                />
                                            )}
                                        </DropdownMenuButton>
                                    ))}
                                    <hr className="mx-3 mt-2 mb-1" />
                                    <DropdownMenuButton
                                        className="flex flex-nowrap items-center gap-2 text-left"
                                        onClick={() => {
                                            void openDesktopSettings('connectors');
                                        }}
                                    >
                                        <LumoIcon aria-hidden className="shrink-0" name="ExternalLink" size={16} />
                                        <span>{
                                            // translator: Menu item opening the Lumo desktop app settings for external connectors.
                                            c('collider_2025:Action').t`Connector settings`
                                        }</span>
                                    </DropdownMenuButton>
                                    <hr className="mx-3 my-1" />
                                    <DropdownMenuButton
                                        className="flex flex-nowrap items-center gap-2 text-left color-danger"
                                        onClick={() =>
                                            updateSchedule({
                                                connectors: schedule.connectors.filter(({ id }) => id !== connector.id),
                                            })
                                        }
                                    >
                                        <LumoIcon aria-hidden className="shrink-0" name="Trash" size={16} />
                                        <span>{
                                            // translator: Menu item removing the selected skill or connector from this scheduled task only; it remains available in settings.
                                            c('collider_2025:Action').t`Remove from this task`
                                        }</span>
                                    </DropdownMenuButton>
                                </DropdownMenu>
                            </SimpleDropdown>
                        </div>
                    );
                })}

                {/* Empty state when the task has no selected skills or connectors. */}
                {!resourceCount && (
                    <p className="text-sm color-weak">{
                        // translator: Empty state in the scheduled task side panel when no skills or connectors are selected.
                        c('collider_2025:Info').t`No skills or tools added.`
                    }</p>
                )}
            </div>
        </section>
    );
};
