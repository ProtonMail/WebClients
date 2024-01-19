import { useVPNServersCount as actualUseVpnServersCount } from '@proton/account';
import { VPNServersCountData } from '@proton/shared/lib/interfaces';

const useVPNServersCount = actualUseVpnServersCount as unknown as () => [VPNServersCountData, boolean];

export default useVPNServersCount;
