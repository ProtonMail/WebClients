import { useId, useRef } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import SimpleDropdown from '@proton/components/components/dropdown/SimpleDropdown';
import { DropdownSizeUnit } from '@proton/components/components/dropdown/utils';
import EllipsisLoader from '@proton/components/components/loader/EllipsisLoader';
import type { DesktopConnector } from '@proton/lumo-api-client/core/desktop-tools';
import { openDesktopSettings, useDesktopManifests } from '@proton/lumo-api-client/core/desktop-tools';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import type { ScheduleConnector } from '../types';
import { ConnectorChip, ConnectorIcon } from './ConnectorChip';
import { getConnectorStatusLabel } from './utils/connectors';

import './ConnectorList.scss';

const isUsable = (connector: DesktopConnector) =>
    connector.enabled !== false && connector.readiness?.state !== 'blocked';

const isUsableWithWarningStatus = (connector: DesktopConnector) =>
    isUsable(connector) && connector.status?.state === 'warning';

type ConnectorListProps = {
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
    value: selectedConnectors,
    onChange,
    editMode,
    connectors,
    labelId,
}: ConnectorListReadyViewProps) => {
    const addConnectorButtonRef = useRef<HTMLButtonElement>(null);

    const unselectedConnectors = connectors.filter(
        (connector) => !selectedConnectors.some(({ id }) => id === connector.id)
    );

    const showWarning = selectedConnectors.some(({ id }) =>
        connectors.some(
            (connector) => connector.id === id && (!isUsable(connector) || isUsableWithWarningStatus(connector))
        )
    );

    return (
        <>
            <fieldset aria-labelledby={labelId} className="flex flex-wrap gap-2 m-0 p-0 border-none">
                {/* Selected connectors */}
                {selectedConnectors.map((connector) => {
                    const manifest = connectors.find(({ id }) => id === connector.id);
                    const unavailable = !manifest || !isUsable(manifest);
                    return (
                        <ConnectorChip
                            key={connector.id}
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
                    );
                })}

                {/* Add connector button */}
                {editMode && (
                    <SimpleDropdown
                        ref={addConnectorButtonRef}
                        as="button"
                        className="connector-list__add-connector-chip button-ghost-norm inline-flex flex-nowrap shrink-0 items-center gap-1.5 border border-dashed rounded cursor-pointer interactive interactive--no-background"
                        content={
                            <>
                                <LumoIcon aria-hidden className="shrink-0" name="Plus" size={14} />
                                <span>{
                                    // translator: Button opening the scheduled task's connector picker.
                                    c('collider_2025:Action').t`Add connector`
                                }</span>
                            </>
                        }
                        dropdownSize={{ width: DropdownSizeUnit.Dynamic }}
                        hasCaret={false}
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
    const { manifests, status } = useDesktopManifests();

    const renderView = () => {
        switch (status) {
            case 'loading':
                return <ConnectorListLoadingView />;
            case 'error':
                return <ConnectorListErrorView />;
            case 'ready':
                return <ConnectorListReadyView {...props} connectors={manifests} labelId={labelId} />;
        }
    };

    return (
        <section className="flex flex-column gap-3">
            <span className={clsx('m-0 text-semibold', props.headerClassName)} id={labelId}>
                {
                    // translator: Heading for the scheduled task's allowed connectors (external tools and services).
                    c('collider_2025:Label').t`Connectors this task can use`
                }
            </span>
            {renderView()}
        </section>
    );
};
