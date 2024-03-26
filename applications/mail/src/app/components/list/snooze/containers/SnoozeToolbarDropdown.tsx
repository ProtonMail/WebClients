import { c } from 'ttag';

import { Vr } from '@proton/atoms/Vr';
import { Icon, useModalState } from '@proton/components/components';

import { useSelectAll } from 'proton-mail/hooks/useSelectAll';

import useSnooze from '../../../../hooks/actions/useSnooze';
import ToolbarDropdown, { DropdownRenderProps } from '../../../toolbar/ToolbarDropdown';
import SnoozeUpsellModal from '../components/SnoozeUpsellModal';
import SnoozeToolbarDropdownStepWrapper, {
    SnoozeToolbarDropdownStepWrapperProps,
} from './SnoozeToolbarDropdownStepWrapper';

interface Props {
    labelID: string;
    selectedIDs: string[];
}

const SnoozeToolbarDropdown = ({ selectedIDs, labelID }: Props) => {
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
