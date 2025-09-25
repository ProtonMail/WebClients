import { c, msgid } from 'ttag';

export const getServersInWithoutPlus = (numberOfServers: string, numberOfCountries: number) => {
    // translator: numberOfServers is a string that looks like `20 servers`. It has been pluralized earlier.
    return c('VPN Plan Feature').ngettext(
        msgid`${numberOfServers} in ${numberOfCountries} country`,
        `${numberOfServers} in ${numberOfCountries} countries`,
        numberOfCountries
    );
};

export const getCountriesWithoutPlus = (numberOfCountries: number) => {
    return c('VPN Plan Feature').ngettext(
        msgid`${numberOfCountries} country`,
        `${numberOfCountries} countries`,
        numberOfCountries
    );
};

export const getAutoSelectFromCountries = (numberOfCountries: number) => {
    return c('VPN Plan Feature').ngettext(
        msgid`Auto-selects from ${numberOfCountries} country`,
        `Auto-selects from ${numberOfCountries} countries`,
        numberOfCountries
    );
};

export const getSelectFromNCountries = (numberOfCountries: number) => {
    return c('VPN Plan Feature').ngettext(
        msgid`Servers in ${numberOfCountries}+ country`,
        `Servers in ${numberOfCountries}+ countries`,
        numberOfCountries
    );
};

export const getServersIn = (numberOfServers: string, numberOfCountries: number) => {
    // translator: numberOfServers is a string that looks like `1300+ servers`, It has been pluralized earlier.
    return c('VPN Plan Feature').ngettext(
        msgid`${numberOfServers} across ${numberOfCountries} country`,
        `${numberOfServers} across ${numberOfCountries}+ countries`,
        numberOfCountries
    );
};

export const getVpnConnections = (n = 0) => {
    return c('VPN Plan Feature').ngettext(msgid`${n} VPN connection`, `${n} VPN connections`, n);
};

export const getVpnDevices = (n = 0) => {
    return c('VPN Plan Feature').ngettext(msgid`${n} device`, `${n} devices`, n);
};

export const getVpnServers = (n = 0) => {
    return c('VPN Plan Feature').ngettext(msgid`${n} server`, `${n}+ servers`, n);
};

export const getVpnServersWithoutPlus = (n = 0) => {
    return c('VPN Plan Feature').ngettext(msgid`${n} server`, `${n} servers`, n);
};

export const getPlusServers = (servers = 1300, countries = 0) => {
    return getServersIn(getVpnServers(servers), countries);
};

export const getBasicServers = (servers = 350, countries = 0) => {
    return getServersIn(getVpnServers(servers), countries);
};

export const getFreeServers = (servers = 0, countries = 0) => {
    return getServersInWithoutPlus(getVpnServers(servers), countries);
};
