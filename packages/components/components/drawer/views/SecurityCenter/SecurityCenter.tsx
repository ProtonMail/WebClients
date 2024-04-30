import { baseUseSelector } from '@proton/redux-shared-store/sharedContext';

import { DrawerAppScrollContainer } from '../shared';
import AccountSecurity from './AccountSecurity/AccountSecurity';
import { selectCanDisplayAccountSecuritySection } from './AccountSecurity/slice/accountSecuritySlice';
import BreachAlertsSecurityCenter from './BreachAlerts/BreachAlertsSecurityCenter';
import PassAliasesContainer from './PassAliases/PassAliasesContainer';
import ProtonSentinel from './ProtonSentinel/ProtonSentinel';

const SecurityCenter = () => {
    const canDisplayAccountSecurity = baseUseSelector(selectCanDisplayAccountSecuritySection);

    return (
        <DrawerAppScrollContainer>
            <PassAliasesContainer />
            <ProtonSentinel />
            <BreachAlertsSecurityCenter />
            {canDisplayAccountSecurity && <AccountSecurity />}
        </DrawerAppScrollContainer>
    );
};

export default SecurityCenter;
