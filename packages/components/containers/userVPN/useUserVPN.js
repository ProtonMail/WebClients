import { useContext } from 'react';

import UserVPNContext from './userVPNContext';

const useUserVPN = () => {
    const { result = {}, loading } = useContext(UserVPNContext);

    const userVPN = result.VPN;

    const isTrial = userVPN && userVPN.PlanName === 'trial';
    const isBasic = userVPN && userVPN.PlanName === 'vpnbasic';
    const tier = isTrial ? 0 : userVPN && userVPN.MaxTier;

    return { loading, userVPN, isTrial, isBasic, tier };
};

export default useUserVPN;
