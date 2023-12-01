import { c } from 'ttag';

import { Vr } from '@proton/atoms/Vr';
import { Icon, useModalState, useSpotlightShow } from '@proton/components/components';
import { FeatureCode } from '@proton/components/containers';
import { useSpotlightOnFeature } from '@proton/components/hooks';

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

const SnoozeToolbarDropdown = ({ selectedIDs }: Props) => {
    const { canSnooze, canUnsnooze, isSnoozeEnabled } = useSnooze();
    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();
    const { show: showSpotlight, onDisplayed, onClose } = useSpotlightOnFeature(FeatureCode.SpotlightSnooze, canSnooze);
    const show = useSpotlightShow(showSpotlight);

    // The title is set to undefined when the spotlight is present to avoid having the tooltip displayed when hovering the spotlight
    const tooltipTitle = show ? undefined : c('Title').t`Snooze`;

    if (!selectedIDs.length || !isSnoozeEnabled || (!canSnooze && !canUnsnooze)) {
        return null;
    }

    return (
        <>
            <Vr />
            <ToolbarDropdown
                disabled={!selectedIDs || !selectedIDs.length}
                content={
                    <SnoozeSpotlight show={show} onDisplayed={onDisplayed} onClose={onClose}>
                        <Icon className="toolbar-icon flex" name="clock" alt={c('Title').t`Snooze`} />
                    </SnoozeSpotlight>
                }
                title={tooltipTitle}
                clickCallback={onClose}
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
