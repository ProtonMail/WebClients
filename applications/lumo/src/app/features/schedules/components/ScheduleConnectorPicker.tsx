import { useId, useRef } from 'react';

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

const isUsable = (connector: DesktopConnector) =>
    connector.enabled !== false && connector.readiness?.state !== 'blocked';

const isUsableWithWarningStatus = (connector: DesktopConnector) =>
    isUsable(connector) && connector.status?.state === 'warning';

interface ScheduleConnectorPickerProps {
    /** The connectors that are currently selected. */
    value: ScheduleConnector[];
    /** The function to call when the user selects/unselects a connector. */
    onChange: (connectors: ScheduleConnector[]) => void;
}

interface ScheduleConnectorPickerReadyViewProps extends ScheduleConnectorPickerProps {
    connectors: DesktopConnector[];
    labelId: string;
}

const ScheduleConnectorPickerReadyView = ({
    value: selectedConnectors,
    onChange,
    connectors,
    labelId,
}: ScheduleConnectorPickerReadyViewProps) => {
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
                                    enabled: false,
                                    readiness: { state: 'blocked', reason: 'Connector is not registered' },
                                    status: { state: 'not_ready', reason: 'Not connected yet' },
                                }
                            }
                            unavailable={unavailable}
                            onRemove={() => {
                                onChange(selectedConnectors.filter(({ id }) => id !== connector.id));
                                addConnectorButtonRef.current?.focus();
                            }}
                        />
                    );
                })}

                {/* Add connector button */}
                <SimpleDropdown
                    ref={addConnectorButtonRef}
                    as="button"
                    type="button"
                    hasCaret={false}
                    className="scheduled-task-editor-modal__add-connector-chip button-ghost-norm inline-flex flex-nowrap shrink-0 items-center gap-1.5 border border-dashed rounded cursor-pointer interactive interactive--no-background"
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
                                    <ConnectorIcon icon={connector.icon} unavailable={unavailable} warning={warning} />
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
            </fieldset>

            {showWarning && (
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

const ScheduleConnectorPickerLoadingView = () => (
    <div className="block m-0 text-sm color-weak">
        {
            // translator: Loading state while retrieving the scheduled task's connectors from Desktop.
            c('collider_2025:Info').t`Loading connectors`
        }
        <EllipsisLoader />
    </div>
);

const ScheduleConnectorPickerErrorView = () => (
    <div className="block m-0 text-sm color-danger">{
        // translator: Error when retrieving the scheduled task's connectors from Desktop fails.
        c('collider_2025:Error').t`Could not load connectors`
    }</div>
);

export const ScheduleConnectorPicker = (props: ScheduleConnectorPickerProps) => {
    const id = useId();
    const labelId = `${id}-label`;
    const { manifests, status } = useDesktopManifests();

    const renderView = () => {
        switch (status) {
            case 'loading':
                return <ScheduleConnectorPickerLoadingView />;
            case 'error':
                return <ScheduleConnectorPickerErrorView />;
            case 'ready':
                return <ScheduleConnectorPickerReadyView {...props} connectors={manifests} labelId={labelId} />;
        }
    };

    return (
        <section className="flex flex-column gap-3">
            <span className="m-0 text-rg text-semibold" id={labelId}>
                {
                    // translator: Heading for the scheduled task's allowed connectors (external tools and services).
                    c('collider_2025:Label').t`Connectors this task can use`
                }
            </span>
            {renderView()}
        </section>
    );
};
