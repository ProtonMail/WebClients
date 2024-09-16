import type { MouseEvent } from 'react';
import { useEffect } from 'react';

import { c } from 'ttag';

import { Dropdown, DropdownButton, Icon, Tooltip, useModalState, usePopperAnchor } from '@proton/components';
import { useApi, useUser } from '@proton/components/hooks';
import { TelemetryMailEvents } from '@proton/shared/lib/api/telemetry';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';
import { selectSnoozeDropdownState, selectSnoozeElement } from 'proton-mail/store/snooze/snoozeSliceSelectors';

import type { SNOOZE_DURATION } from '../../../../hooks/actions/useSnooze';
import useSnooze from '../../../../hooks/actions/useSnooze';
import type { Element } from '../../../../models/element';
import { snoozeActions } from '../../../../store/snooze/snoozeSlice';
import SnoozeCustomTime from '../components/SnoozeCustomTime';
import SnoozeDurationSelection from '../components/SnoozeDurationSelection';
import SnoozeUpsellModal from '../components/SnoozeUpsellModal';
import { sendSnoozeReport } from '../helpers/snoozeTelemetry';

interface Props {
    elements: Element[];
    labelID: string;
    size?: 'small' | 'medium';
}

const SnoozeDropdown = ({ elements, size, labelID }: Props) => {
    const api = useApi();
    const dispatch = useMailDispatch();
    const [{ hasPaidMail }] = useUser();
    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    const { anchorRef, isOpen, toggle, close: dropdownClose, open } = usePopperAnchor<HTMLButtonElement>();
    const { canSnooze, canUnsnooze, snooze, unsnooze, handleClose, handleCustomClick, snoozeState } = useSnooze();

    const snoozeDropdownState = useMailSelector(selectSnoozeDropdownState);
    const snoozeSelectedElement = useMailSelector(selectSnoozeElement);

    useEffect(() => {
        if (snoozeDropdownState === 'forceOpen' && snoozeSelectedElement?.ID === elements[0].ID) {
            dispatch(snoozeActions.setSnoozeDropdownOpen());
            open();
        }
    }, [snoozeDropdownState]);

    if (!elements.length || (!canSnooze && !canUnsnooze)) {
        return null;
    }

    const onClose = () => {
        dispatch(snoozeActions.resetSnoozeDropdown());
        handleClose();
        dropdownClose();
    };

    const handleSnooze = (event: MouseEvent, duration: SNOOZE_DURATION, snoozeTime?: Date) => {
        event.stopPropagation();
        void snooze({ elements, duration, snoozeTime });
        onClose();
    };

    const handleUnsnooze = (event: MouseEvent) => {
        event.stopPropagation();
        void unsnooze(elements);
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
            void sendSnoozeReport(api, {
                event: TelemetryMailEvents.snooze_open_dropdown,
                dimensions: {
                    snooze_open_dropdown: 'hover',
                },
            });

            dispatch(
                snoozeActions.setSnoozeDropdown({
                    dropdownState: 'open',
                    element: elements[0],
                })
            );
        }

        action();
    };

    const labelText = labelID === MAILBOX_LABEL_IDS.SNOOZED ? c('Action').t`Manage Snooze` : c('Action').t`Snooze`;

    return (
        <>
            <Tooltip title={labelText} tooltipClassName="pointer-events-none">
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
                <SnoozeCustomTime onClose={onClose} handleSnooze={handleSnooze} element={elements[0]} />
            </Dropdown>
            {renderUpsellModal && (
                <SnoozeUpsellModal {...upsellModalProps} onClose={() => handleUpsellModalDisplay(false)} />
            )}
        </>
    );
};

export default SnoozeDropdown;
