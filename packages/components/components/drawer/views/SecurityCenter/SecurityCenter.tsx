import { useFlag } from '@proton/components/containers';

import { DrawerAppScrollContainer } from '../shared';
import PassAliasesContainer from './PassAliases/PassAliasesContainer';
import ProtonSentinel from './ProtonSentinel/ProtonSentinel';

const SecurityCenter = () => {
    const canDisplayPassAliases = useFlag('DrawerSecurityCenterDisplayPassAliases');
    return (
        <DrawerAppScrollContainer>
            {canDisplayPassAliases && <PassAliasesContainer />}
            <ProtonSentinel />
        </DrawerAppScrollContainer>
    );
};

export default SecurityCenter;
