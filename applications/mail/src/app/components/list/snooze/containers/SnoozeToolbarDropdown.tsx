import { c } from 'ttag';

import { Vr } from '@proton/atoms/Vr';
import { Icon, useModalState } from '@proton/components/components';

import useSnooze from '../../../../hooks/actions/useSnooze';
import ToolbarDropdown, { DropdownRenderProps } from '../../../toolbar/ToolbarDropdown';
import SnoozeSpotlight from '../components/SnoozeSpotlight';
import SnoozeUpsellModal from '../components/SnoozeUpsellModal';
import SnoozeToolbarDropdownStepWrapper, {
    SnoozeToolbarDropdownStepWrapperProps,
} from './SnoozeToolbarDropdownStepWrapper';

interface Props {
    labelID: string;
    selectedIDs: string[];
}

const SnoozeToolbarButonWithSpotlight = () => {
    return (
        <SnoozeSpotlight>
            <Icon className="toolbar-icon" name="clock" />
        </SnoozeSpotlight>
    );
};

const SnoozeToolbarDropdown = ({ selectedIDs }: Props) => {
    const { canSnooze, canUnsnooze, isSnoozeEnabled } = useSnooze();
    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    if (!selectedIDs.length || !isSnoozeEnabled || (!canSnooze && !canUnsnooze)) {
        return null;
    }

    return (
        <>
            <Vr />
            <ToolbarDropdown
                disabled={!selectedIDs || !selectedIDs.length}
                content={<SnoozeToolbarButonWithSpotlight />}
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
