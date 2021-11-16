import { useState, useEffect } from 'react';

import { c, msgid } from 'ttag';
import { useVPNServersCount } from '@proton/components';
import { PLANS } from '../constants';

export const GetServersNumber = () => {
    const [result, setResult] = useState({ allServers: 1300, basicServers: 350 });
    const [vpnServersCount] = useVPNServersCount();

    useEffect(() => {
        setResult({ allServers: vpnServersCount[PLANS.VPNPLUS], basicServers: vpnServersCount[PLANS.VPNBASIC] });
    }, [vpnServersCount]);

    return [result];
};
export const getServersInWithoutPlus = (numberOfServers: string, numberOfCountries: number) => {
    // translator: numberOfServers is a string that looks like `20 servers`. It has been pluralized earlier.
    return c('VPN Plan Feature').ngettext(
        msgid`${numberOfServers} in ${numberOfCountries} country`,
        `${numberOfServers} in ${numberOfCountries} countries`,
        numberOfCountries
    );
};

export const getServersIn = (numberOfServers: string, numberOfCountries: number) => {
    // translator: numberOfServers is a string that looks like `1300+ servers`, It has been pluralized earlier.
    return c('VPN Plan Feature').ngettext(
        msgid`${numberOfServers} in ${numberOfCountries} country`,
        `${numberOfServers} in ${numberOfCountries}+ countries`,
        numberOfCountries
    );
};

export const getVpnConnections = (n = 0) => {
    return c('VPN Plan Feature').ngettext(msgid`${n} VPN connection`, `${n} VPN connections`, n);
};

export const getVpnServers = (n = 0) => {
    return c('VPN Plan Feature').ngettext(msgid`${n} server`, `${n}+ servers`, n);
};

export const getVpnServersWithoutPlus = (n = 0) => {
    return c('VPN Plan Feature').ngettext(msgid`${n} server`, `${n} servers`, n);
};

export const getPlusServers = (countries = 0) => {
    const [result] = GetServersNumber();
    return getServersInWithoutPlus(getVpnServers(result.allServers), countries);
};

export const getBasicServers = (countries = 0) => {
    const [result] = GetServersNumber();
    return getServersIn(getVpnServers(result.basicServers), countries);
};

export const getFreeServers = (servers = 0, countries = 0) => {
    return getServersInWithoutPlus(getVpnServersWithoutPlus(servers), countries);
};
