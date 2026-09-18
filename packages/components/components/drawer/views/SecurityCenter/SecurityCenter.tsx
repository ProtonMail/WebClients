import type { ReactNode } from 'react';

import { selectCanDisplayAccountSecuritySection } from '@proton/account';
import { baseUseSelector } from '@proton/react-redux-store';

import DrawerAppScrollContainer from '../shared/DrawerAppScrollContainer';
import AccountSecurity from './AccountSecurity/AccountSecurity';
import BreachAlertsSecurityCenter from './BreachAlerts/BreachAlertsSecurityCenter';
import ProtonSentinel from './ProtonSentinel/ProtonSentinel';

interface Props {
    /** Pass aliases section; supplied by the product so components stays free of @proton/pass. */
    passAliasesView?: ReactNode;
}

const SecurityCenter = ({ passAliasesView }: Props) => {
    const canDisplayAccountSecurity = baseUseSelector(selectCanDisplayAccountSecuritySection);

    return (
        <DrawerAppScrollContainer>
            {passAliasesView}
            <ProtonSentinel />
            <BreachAlertsSecurityCenter />
            {canDisplayAccountSecurity && <AccountSecurity />}
        </DrawerAppScrollContainer>
    );
};

export default SecurityCenter;
