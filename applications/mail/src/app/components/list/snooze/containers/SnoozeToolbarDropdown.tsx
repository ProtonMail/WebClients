import { c } from 'ttag';

import { Vr } from '@proton/atoms';
import { Icon, useModalState } from '@proton/components';
import { useApi } from '@proton/components/hooks';
import { TelemetryMailEvents } from '@proton/shared/lib/api/telemetry';

import { useSelectAll } from 'proton-mail/hooks/useSelectAll';

import useSnooze from '../../../../hooks/actions/useSnooze';
import type { DropdownRenderProps } from '../../../toolbar/ToolbarDropdown';
import ToolbarDropdown from '../../../toolbar/ToolbarDropdown';
import SnoozeUpsellModal from '../components/SnoozeUpsellModal';
import { sendSnoozeReport } from '../helpers/snoozeTelemetry';
import SnoozeToolbarDropdownStepWrapper, {
    SnoozeToolbarDropdownStepWrapperProps,
} from './SnoozeToolbarDropdownStepWrapper';

interface Props {
    labelID: string;
    selectedIDs: string[];
}

const SnoozeToolbarDropdown = ({ selectedIDs, labelID }: Props) => {
    const api = useApi();

    const { canSnooze, canUnsnooze } = useSnooze();
    const { selectAll } = useSelectAll({ labelID });

    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    if (!selectedIDs.length || (!canSnooze && !canUnsnooze)) {
        return null;
    }

    return (
        <>
            <Vr />
            <ToolbarDropdown
                clickCallback={() => {
                    void sendSnoozeReport(api, {
                        event: TelemetryMailEvents.snooze_open_dropdown,
                        dimensions: { snooze_open_dropdown: 'toolbar' },
                    });
                }}
                disabled={!selectedIDs || !selectedIDs.length || selectAll}
                content={<Icon className="toolbar-icon flex" name="clock" alt={c('Title').t`Snooze`} />}
                title={c('Title').t`Snooze`}
                data-testid="toolbar:snooze"
                hasCaret={false}
                autoClose={false}
            >
                {{
                    contentProps: SnoozeToolbarDropdownStepWrapperProps,
                    render: ({ onClose, onLock }: DropdownRenderProps) => (
                        <>
                            <SnoozeToolbarDropdownStepWrapper
                                onClose={onClose}
                                onLock={onLock}
                                selectedIDs={selectedIDs}
                                displayUpsellModal={() => handleUpsellModalDisplay(true)}
                            />
                        </>
                    ),
                }}
            </ToolbarDropdown>
            {renderUpsellModal && <SnoozeUpsellModal {...upsellModalProps} />}
        </>
    );
};

export default SnoozeToolbarDropdown;
