import type { ComponentType } from 'react';

import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { APPS, CALENDAR_APP_NAME } from '@proton/shared/lib/constants';
import { getIsBYOEOnlyAccount } from '@proton/shared/lib/helpers/address';
import type { Optional } from '@proton/shared/lib/interfaces/utils';

import useDrawer from '../../../hooks/drawer/useDrawer';
import useDynamicMonthDay from '../../../hooks/useDynamicMonthDay';
import type { ModalStateProps } from '../../modalTwo/useModalState';
import useModalState from '../../modalTwo/useModalState';
import CalendarDrawerLogo from '../drawerIcons/CalendarDrawerLogo';
import type { Props } from './DrawerAppButton';
import DrawerAppButton from './DrawerAppButton';

interface CalendarDrawerAppButtonProps extends Optional<Omit<Props, 'tooltipText' | 'buttonContent'>, 'onClick'> {
    /** Opened instead of the calendar for accounts with only external addresses; supplied by the product so components stays free of @proton/byoe. */
    ClaimProtonAddressModal: ComponentType<ModalStateProps>;
}

const CalendarDrawerAppButton = ({ onClick, ClaimProtonAddressModal, ...rest }: CalendarDrawerAppButtonProps) => {
    const [addresses] = useAddresses();
    const { toggleDrawerApp } = useDrawer();
    const monthDay = useDynamicMonthDay();

    const [claimProtonAddressModalProps, setClaimProtonAddressModalProps, renderClaimProtonAddressModal] =
        useModalState();

    const handleClick = () => {
        if (getIsBYOEOnlyAccount(addresses)) {
            setClaimProtonAddressModalProps(true);
            return;
        }
        onClick?.();
        toggleDrawerApp({ app: APPS.PROTONCALENDAR })();
    };

    return (
        <>
            <DrawerAppButton
                key="toggle-calendar-drawer-app-button"
                tooltipText={CALENDAR_APP_NAME}
                data-testid="calendar-drawer-app-button:calendar-icon"
                buttonContent={<CalendarDrawerLogo monthDay={monthDay} />}
                onClick={handleClick}
                alt={c('Action').t`Toggle Calendar app`}
                aria-controls="drawer-app-iframe-proton-calendar"
                {...rest}
            />
            {renderClaimProtonAddressModal && <ClaimProtonAddressModal {...claimProtonAddressModalProps} />}
        </>
    );
};

export default CalendarDrawerAppButton;
