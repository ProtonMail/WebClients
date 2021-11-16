import { c, msgid } from 'ttag';

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

export const getPlusServers = (servers = 1300, countries = 0) => {
    return getServersInWithoutPlus(getVpnServers(servers), countries);
};

export const getBasicServers = (servers = 350, countries = 0) => {
    return getServersIn(getVpnServers(servers), countries);
};

export const getFreeServers = (servers = 0, countries = 0) => {
    return getServersInWithoutPlus(getVpnServersWithoutPlus(servers), countries);
};
