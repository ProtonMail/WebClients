import { useFlag } from '@proton/components/containers';
import { baseUseSelector } from '@proton/redux-shared-store';

import { DrawerAppScrollContainer } from '../shared';
import AccountSecurity from './AccountSecurity/AccountSecurity';
import { selectCanDisplayAccountSecuritySection } from './AccountSecurity/slice/accountSecuritySlice';
import PassAliasesContainer from './PassAliases/PassAliasesContainer';
import ProtonSentinel from './ProtonSentinel/ProtonSentinel';

const SecurityCenter = () => {
    const canDisplayPassAliases = useFlag('DrawerSecurityCenterDisplayPassAliases');
    const canDisplayAccountSecurity = baseUseSelector(selectCanDisplayAccountSecuritySection);

    return (
        <DrawerAppScrollContainer>
            {canDisplayPassAliases && <PassAliasesContainer />}
            <ProtonSentinel />
            {canDisplayAccountSecurity && <AccountSecurity />}
        </DrawerAppScrollContainer>
    );
};

export default SecurityCenter;
