import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import BYOEClaimProtonAddressModal from '@proton/activation/src/components/Modals/BYOEClaimProtonAddressModal/BYOEClaimProtonAddressModal';
import type { Props } from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import DrawerAppButton from '@proton/components/components/drawer/drawerAppButtons/DrawerAppButton';
import useDynamicMonthDay from '@proton/components/hooks/useDynamicMonthDay';
import { APPS, BRAND_NAME, CALENDAR_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getIsBYOEOnlyAccount } from '@proton/shared/lib/helpers/address';
import type { Optional } from '@proton/shared/lib/interfaces';

import useDrawer from '../../../hooks/drawer/useDrawer';
import useModalState from '../../modalTwo/useModalState';
import CalendarDrawerLogo from '../drawerIcons/CalendarDrawerLogo';

const CalendarDrawerAppButton = ({
    onClick,
    ...rest
}: Optional<Omit<Props, 'tooltipText' | 'buttonContent'>, 'onClick'>) => {
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
            {renderClaimProtonAddressModal && (
                <BYOEClaimProtonAddressModal
                    toApp={APPS.PROTONMAIL}
                    title={c('Title').t`Get full access to ${CALENDAR_APP_NAME}`}
                    description={c('Info')
                        .t`${CALENDAR_APP_NAME} requires a ${BRAND_NAME} address for secure event sync and encryption. Claim your free ${MAIL_APP_NAME} address now.`}
                    {...claimProtonAddressModalProps}
                />
            )}
        </>
    );
};

export default CalendarDrawerAppButton;
