import { MouseEvent } from 'react';

import { c } from 'ttag';

import { Dropdown, DropdownButton, Icon, Tooltip, useModalState, usePopperAnchor } from '@proton/components/components';
import { useUser } from '@proton/components/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import useSnooze, { SNOOZE_DURATION } from '../../../../hooks/actions/useSnooze';
import { snoozeActions } from '../../../../logic/snooze/snoozeSlice';
import { useAppDispatch } from '../../../../logic/store';
import { Element } from '../../../../models/element';
import SnoozeCustomTime from '../components/SnoozeCustomTime';
import SnoozeDurationSelection from '../components/SnoozeDurationSelection';
import SnoozeUpsellModal from '../components/SnoozeUpsellModal';

interface Props {
    elements: Element[];
    labelID: string;
    size?: 'small' | 'medium';
}

const SnoozeDropdown = ({ elements, size, labelID }: Props) => {
    const dispatch = useAppDispatch();
    const [{ hasPaidMail }] = useUser();
    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    const { anchorRef, isOpen, toggle, close: dropdownClose } = usePopperAnchor<HTMLButtonElement>();
    const { canSnooze, canUnsnooze, isSnoozeEnabled, snooze, unsnooze, handleClose, handleCustomClick, snoozeState } =
        useSnooze();

    if (!elements.length || !isSnoozeEnabled || (!canSnooze && !canUnsnooze)) {
        return null;
    }

    const onClose = () => {
        dispatch(snoozeActions.resetSnoozeDropdown());
        handleClose();
        dropdownClose();
    };

    const handleSnooze = (event: MouseEvent, duration: SNOOZE_DURATION, snoozeTime?: Date) => {
        event.stopPropagation();
        snooze({ elements, duration, snoozeTime });
        onClose();
    };

    const handleUnsnooze = (event: MouseEvent) => {
        event.stopPropagation();
        unsnooze(elements);
        onClose();
    };

    const handleCustom = (event: MouseEvent) => {
        event.stopPropagation();
        if (hasPaidMail) {
            handleCustomClick();
            return;
        }
        handleUpsellModalDisplay(true);
        onClose();
    };

    const handleDropdownClick = (event: MouseEvent) => {
        event.stopPropagation();
        // We want to reset state when the dropdown is open
        const action = isOpen ? onClose : toggle;
        if (!isOpen) {
            dispatch(
                snoozeActions.setSnoozeDropdown({
                    dropdownState: true,
                    element: elements[0],
                })
            );
        }

        action();
    };

    const labelText = labelID === MAILBOX_LABEL_IDS.SNOOZED ? c('Action').t`Manage Snooze` : c('Action').t`Snooze`;

    return (
        <>
            <Tooltip title={labelText} tooltipClassName="no-pointer-events">
                <DropdownButton
                    ref={anchorRef}
                    isOpen={isOpen}
                    className="color-inherit"
                    onClick={handleDropdownClick}
                    shape="ghost"
                    size={size}
                    icon
                >
                    <Icon name="clock" alt={labelText} />
                </DropdownButton>
            </Tooltip>
            <Dropdown
                isOpen={isOpen && snoozeState === 'snooze-selection'}
                anchorRef={anchorRef}
                onClose={onClose}
                size={{
                    width: '22em',
                    maxWidth: '22em',
                }}
            >
                <SnoozeDurationSelection
                    canUnsnooze={canUnsnooze}
                    handleUnsnoozeClick={handleUnsnooze}
                    handleSnooze={handleSnooze}
                    handleCustomClick={handleCustom}
                />
            </Dropdown>

            <Dropdown
                isOpen={isOpen && snoozeState === 'custom-snooze'}
                anchorRef={anchorRef}
                onClose={onClose}
                autoClose={false}
                autoCloseOutside={false}
                size={{
                    width: '22em',
                    maxWidth: '22em',
                }}
            >
                <SnoozeCustomTime onClose={onClose} handleSnooze={handleSnooze} />
            </Dropdown>
            {renderUpsellModal && (
                <SnoozeUpsellModal {...upsellModalProps} onClose={() => handleUpsellModalDisplay(false)} />
            )}
        </>
    );
};

export default SnoozeDropdown;
