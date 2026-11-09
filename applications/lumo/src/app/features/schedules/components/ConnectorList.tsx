import { useId, useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Banner } from '@proton/atoms/Banner/Banner';
import { Button } from '@proton/atoms/Button/Button';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';
import type { DesktopConnector } from '@proton/lumo-api-client/core/desktop-tools';
import { openDesktopSettings, supportsDesktopScheduleReadOnly } from '@proton/lumo-api-client/core/desktop-tools';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import type { ScheduleConnector } from '../types';
import { useScheduleConnectors } from '../useScheduleConnectors';
import { ConnectorChip, ConnectorIcon } from './ConnectorChip';
import { getConnectorStatusLabel, isScheduleConnectorUsable } from './utils/connectors';

import './ChipList.scss';

const isUsable = isScheduleConnectorUsable;

const isUsableWithWarningStatus = (connector: DesktopConnector) =>
    isUsable(connector) && connector.status?.state === 'warning';

type ConnectorListProps = {
    /** Whether to display the connector list in a compact mode. */
    compact?: boolean;
    /** The header for the connector list. */
    header?: string;
    /** The class name for the header. */
    headerClassName?: string;
    /** The connectors that are currently selected. */
    value: ScheduleConnector[];
} & (
    | {
          /** Allows connectors to be added and removed. */
          editMode: true;
          onChange: (connectors: ScheduleConnector[]) => void;
      }
    | {
          editMode?: false;
          onChange?: never;
      }
);

type ConnectorListReadyViewProps = ConnectorListProps & {
    connectors: DesktopConnector[];
    labelId: string;
};

const ConnectorListReadyView = ({
    compact,
    connectors,
    editMode,
    header,
    headerClassName,
    labelId,
    onChange,
    value: selectedConnectors,
}: ConnectorListReadyViewProps) => {
    const addConnectorButtonRef = useRef<HTMLButtonElement>(null);
    const [permissionsExpanded, setPermissionsExpanded] = useState(false);
    const supportsReadOnly = supportsDesktopScheduleReadOnly();
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

    const unselectedConnectors = connectors.filter(
        (connector) => !selectedConnectors.some(({ id }) => id === connector.id)
    );

    const showWarning = selectedConnectors.some(({ id }) => {
        const connector = connectors.find((candidate) => candidate.id === id);
        return !connector || !isUsable(connector) || isUsableWithWarningStatus(connector);
    });

    return (
        <>
            <fieldset
                aria-labelledby={labelId}
                className={clsx('flex flex-wrap m-0 p-0 border-none', compact ? 'gap-1.5' : 'gap-2')}
            >
                {/* Compact header */}
                {compact && (
                    <span
                        className={clsx('schedule-chip-list__header--compact self-center text-sm', headerClassName)}
                        id={labelId}
                    >
                        {header}
                    </span>
                )}

                {/* Selected connectors */}
                {selectedConnectors.map((connector) => {
                    const manifest = connectors.find(({ id }) => id === connector.id);
                    const unavailable = !manifest || !isUsable(manifest);
                    const label = manifest?.display_name ?? connector.label;
                    return (
                        <div
                            className={clsx(
                                'inline-flex flex-nowrap items-center gap-2',
                                editMode && unavailable && 'schedule-chip-list__setup-row w-full'
                            )}
                            key={connector.id}
                        >
                            <ConnectorChip
                                compact={compact}
                                connector={
                                    manifest ?? {
                                        id: connector.id,
                                        display_name: connector.label,
                                        icon: connector.icon,
                                        enabled: false,
                                        readiness: { state: 'blocked', reason: 'Connector is not registered' },
                                        status: { state: 'not_ready', reason: 'Not connected yet' },
                                    }
                                }
                                onRemove={
                                    editMode
                                        ? () => {
                                              onChange(selectedConnectors.filter(({ id }) => id !== connector.id));
                                              addConnectorButtonRef.current?.focus();
                                          }
                                        : undefined
                                }
                                unavailable={unavailable}
                            />
                            {editMode && unavailable && (
                                <Button
                                    aria-label={
                                        // translator: Opens setup for the selected connector. ${label} is the connector name.
                                        c('collider_2025:Action').t`Set up ${label}`
                                    }
                                    className="schedule-chip-list__connect-button shrink-0"
                                    color="weak"
                                    onClick={() => {
                                        void openConnectorSettings(connector.id);
                                    }}
                                    shape="outline"
                                    type="button"
                                >
                                    {manifest?.enabled === false && manifest?.readiness?.state === 'ready'
                                        ? c('collider_2025:Action').t`Manage`
                                        : c('collider_2025:Action').t`Connect`}
                                </Button>
                            )}
                        </div>
                    );
                })}

                {/* Add connector button */}
                {editMode && (
                    <SimpleDropdown
                        as="button"
                        className={clsx(
                            'schedule-chip-list__add-chip button-ghost-norm inline-flex flex-nowrap shrink-0 items-center border border-dashed rounded cursor-pointer interactive interactive--no-background',
                            compact
                                ? 'schedule-chip-list__add-chip--compact gap-1'
                                : 'schedule-chip-list__add-chip--regular gap-1.5'
                        )}
                        content={
                            <>
                                <LumoIcon aria-hidden className="shrink-0" name="Plus" size={compact ? 12 : 14} />
                                <span>{
                                    // translator: Button opening the scheduled task's connector picker.
                                    c('collider_2025:Action').t`Add connector`
                                }</span>
                            </>
                        }
                        dropdownSize={{ width: DropdownSizeUnit.Dynamic }}
                        hasCaret={false}
                        ref={addConnectorButtonRef}
                        type="button"
                    >
                        <DropdownMenu>
                            {unselectedConnectors.map((connector) => {
                                const unavailable = !isUsable(connector);
                                const warning = isUsableWithWarningStatus(connector);
                                return (
                                    <DropdownMenuButton
                                        key={connector.id}
                                        className="flex flex-nowrap items-center gap-2 text-left"
                                        onClick={() => {
                                            onChange([
                                                ...selectedConnectors,
                                                {
                                                    id: connector.id,
                                                    label: connector.display_name,
                                                    icon: connector.icon ?? undefined,
                                                },
                                            ]);
                                        }}
                                    >
                                        <ConnectorIcon
                                            icon={connector.icon}
                                            unavailable={unavailable}
                                            warning={warning}
                                        />
                                        <span className="flex-1">{connector.display_name}</span>
                                        {(unavailable || warning) && (
                                            <span className="ml-2 text-sm color-weak">
                                                {getConnectorStatusLabel(connector)}
                                            </span>
                                        )}
                                    </DropdownMenuButton>
                                );
                            })}

                            {connectors.length === 0 && (
                                <div className="px-4 py-2 text-sm color-weak">
                                    {
                                        // translator: Empty state in the scheduled task's connector picker, directing users to the Manage connectors action below.
                                        c('collider_2025:Info')
                                            .t`No connectors available yet. Manage connectors to set them up.`
                                    }
                                </div>
                            )}

                            <hr className="mx-3 my-1" />

                            <DropdownMenuButton
                                className="flex flex-nowrap items-center gap-2 text-left"
                                onClick={() => {
                                    void openDesktopSettings('connectors');
                                }}
                            >
                                <LumoIcon aria-hidden className="shrink-0" name="Settings" size={16} />
                                <span>{
                                    // translator: Open the desktop app's connector settings from the scheduled task editor.
                                    c('collider_2025:Action').t`Manage connectors`
                                }</span>
                            </DropdownMenuButton>
                        </DropdownMenu>
                    </SimpleDropdown>
                )}
            </fieldset>

            {/* Permissions settings for selected connectors. */}
            {editMode && selectedConnectors.length > 0 && (
                <div className="flex flex-column gap-2">
                    <Button
                        aria-controls={`${labelId}-permissions`}
                        aria-expanded={permissionsExpanded}
                        className="inline-flex self-start items-center gap-1.5 p-0 bg-transparent text-sm color-hint hover:color-weak"
                        onClick={() => setPermissionsExpanded((expanded) => !expanded)}
                        shape="ghost"
                        size="small"
                        type="button"
                    >
                        {
                            // translator: Disclosure button for the scheduled task's per-connector read-only or read-and-write access settings.
                            c('collider_2025:Label').t`Permissions`
                        }
                        <LumoIcon aria-hidden name={permissionsExpanded ? 'ChevronDown' : 'ChevronRight'} size={14} />
                    </Button>
                    <div className="flex flex-column" hidden={!permissionsExpanded} id={`${labelId}-permissions`}>
                        {selectedConnectors.map((connector) => {
                            const manifest = connectors.find(({ id }) => id === connector.id);
                            const label = manifest?.display_name ?? connector.label;
                            const nameId = `${labelId}-${connector.id}-permission-name`;
                            return (
                                <div
                                    className="flex flex-wrap items-center justify-space-between gap-2 py-1"
                                    key={connector.id}
                                >
                                    <span className="min-w-0 text-sm text-break" id={nameId}>
                                        {label}
                                    </span>
                                    <div
                                        aria-labelledby={nameId}
                                        className="inline-flex flex-nowrap gap-0.5 p-0.5 border rounded-lg bg-weak"
                                        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                                        role="group"
                                    >
                                        {permissionOptions.map(({ readOnly, label }) => {
                                            const selected = (connector.readOnly === true) === readOnly;
                                            return (
                                                <Button
                                                    aria-pressed={selected}
                                                    color="norm"
                                                    disabled={readOnly && !supportsReadOnly}
                                                    key={label}
                                                    onClick={() =>
                                                        onChange(
                                                            selectedConnectors.map((item) =>
                                                                item.id === connector.id ? { ...item, readOnly } : item
                                                            )
                                                        )
                                                    }
                                                    shape={selected ? 'solid' : 'ghost'}
                                                    size="tiny"
                                                    title={
                                                        readOnly && !supportsReadOnly
                                                            ? // translator: A scheduled task requires read-only tool permissions unsupported by this desktop version.
                                                              c('collider_2025:Error')
                                                                  .t`Update ${LUMO_SHORT_APP_NAME} Desktop to use read-only connector access for this task.`
                                                            : undefined
                                                    }
                                                    type="button"
                                                >
                                                    {label}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {editMode && showWarning && (
                <Banner className="text-sm" variant="warning">
                    {
                        // translator: Warning in the scheduled task editor when a selected connector is disabled, blocked, or in a warning state.
                        c('collider_2025:Info')
                            .t`Some selected connectors are unavailable or need attention. This task may fail or run without data from those connectors. Check your connectors in the settings.`
                    }
                </Banner>
            )}
        </>
    );
};

const ConnectorListLoadingView = () => (
    <div className="block m-0 text-sm color-weak">
        {
            // translator: Loading state while retrieving the scheduled task's connectors from Desktop.
            c('collider_2025:Info').t`Loading connectors`
        }
        <EllipsisLoader />
    </div>
);

const ConnectorListErrorView = () => (
    <div className="block m-0 text-sm color-danger">{
        // translator: Error when retrieving the scheduled task's connectors from Desktop fails.
        c('collider_2025:Error').t`Could not load connectors`
    }</div>
);

export const ConnectorList = (props: ConnectorListProps) => {
    const id = useId();
    const labelId = `${id}-label`;
    const { connectors, status } = useScheduleConnectors();

    // translator: Heading for the scheduled task's allowed connectors (external tools and services).
    const header = props.header ?? c('collider_2025:Label').t`Tools this task can use`;

    const renderView = () => {
        switch (status) {
            case 'loading':
                return <ConnectorListLoadingView />;
            case 'error':
                return <ConnectorListErrorView />;
            case 'ready':
                return <ConnectorListReadyView {...props} connectors={connectors} header={header} labelId={labelId} />;
        }
    };

    return (
        <section className="flex flex-column flex-nowrap gap-3">
            {!props.compact && (
                <span className={clsx('text-semibold', props.headerClassName)} id={labelId}>
                    {header}
                </span>
            )}
            {renderView()}
        </section>
    );
};
