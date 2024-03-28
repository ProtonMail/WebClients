import { useFlag } from '@proton/components/containers';
import { baseUseSelector } from '@proton/redux-shared-store';

import { DrawerAppScrollContainer } from '../shared';
import AccountSecurity from './AccountSecurity/AccountSecurity';
import { selectCanDisplayAccountSecuritySection } from './AccountSecurity/slice/accountSecuritySlice';
import BreachAlertsSecurityCenter from './BreachAlerts/BreachAlertsSecurityCenter';
import PassAliasesContainer from './PassAliases/PassAliasesContainer';
import ProtonSentinel from './ProtonSentinel/ProtonSentinel';

const SecurityCenter = () => {
    const canDisplayPassAliases = useFlag('DrawerSecurityCenterDisplayPassAliases');
    const canDisplayAccountSecurity = baseUseSelector(selectCanDisplayAccountSecuritySection);
    const canDisplayBreachAlertsInSecCenter = useFlag('BreachesSecurityCenter');

    return (
        <DrawerAppScrollContainer>
            {canDisplayPassAliases && <PassAliasesContainer />}
            <ProtonSentinel />
            {canDisplayBreachAlertsInSecCenter && <BreachAlertsSecurityCenter />}
            {canDisplayAccountSecurity && <AccountSecurity />}
        </DrawerAppScrollContainer>
    );
};

export default SecurityCenter;
