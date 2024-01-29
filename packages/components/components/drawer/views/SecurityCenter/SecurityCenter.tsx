import { useFlag } from '@proton/components/containers';

import { DrawerAppScrollContainer } from '../shared';
import AccountSecurity from './AccountSecurity/AccountSecurity';
import PassAliasesContainer from './PassAliases/PassAliasesContainer';
import ProtonSentinel from './ProtonSentinel/ProtonSentinel';

const SecurityCenter = () => {
    const canDisplayPassAliases = useFlag('DrawerSecurityCenterDisplayPassAliases');
    return (
        <DrawerAppScrollContainer>
            {canDisplayPassAliases && <PassAliasesContainer />}
            <ProtonSentinel />
            <AccountSecurity />
        </DrawerAppScrollContainer>
    );
};

export default SecurityCenter;
