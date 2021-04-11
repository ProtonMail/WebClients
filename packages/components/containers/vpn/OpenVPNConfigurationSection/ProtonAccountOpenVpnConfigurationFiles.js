/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useMemo, useEffect } from 'react';
import { c } from 'ttag';
import { queryVPNLogicalServerInfo, getVPNServerConfig } from 'proton-shared/lib/api/vpn';
import { groupWith } from 'proton-shared/lib/helpers/array';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';
import { Link } from 'react-router-dom';
import {
    Alert,
    Href,
    Icon,
    Info,
    Button,
    Block,
    Tooltip,
    Radio,
    RadioGroup,
    ButtonLike,
    Select,
} from '../../../components';
import { useApiResult, useApiWithoutResult, useUser, useSortedList, useUserVPN, useLoading } from '../../../hooks';
import { getCountryByAbbr, correctAbbr } from '../../../helpers/countries';
import ServerConfigs from './ServerConfigs';
import { isSecureCoreEnabled } from './utils';
import ConfigsTable, { CATEGORY } from './ConfigsTable';
import { SettingsParagraph } from '../../account';
import SettingsLayout from '../../account/SettingsLayout';
import SettingsLayoutLeft from '../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../account/SettingsLayoutRight';

const PLATFORM = {
    MACOS: 'macOS',
    LINUX: 'Linux',
    WINDOWS: 'Windows',
    ANDROID: 'Android',
    IOS: 'iOS',
    ROUTER: 'Router',
};

const PROTOCOL = {
    TCP: 'tcp',
    UDP: 'udp',
};

const CONFIGURATION_OPTIONS = [
    { name: `Secure Core`, category: CATEGORY.SECURE_CORE },
    { name: `Standard servers`, category: CATEGORY.SERVER },
    { name: `Free servers`, category: CATEGORY.FREE },
];

const ProtonAccountOpenVpnConfigurationFiles = () => {
    const [platform, setPlatform] = useState(PLATFORM.ANDROID);
    const [protocol, setProtocol] = useState(PROTOCOL.UDP);
    const [category, setCategory] = useState(CONFIGURATION_OPTIONS[0].category);
    const [configurationSelected, setConfiguration] = useState(CONFIGURATION_OPTIONS[0].name);
    const [countrySelected, setCountry] = useState('');
    const [secureCoreServers, setSecureCoreServers] = useState([]);
    const [standardServers, setStandardServers] = useState([]);
    const [freeServers, setFreeServers] = useState([]);

    const { request } = useApiWithoutResult(getVPNServerConfig);
    const { loading, result = {} } = useApiResult(queryVPNLogicalServerInfo, []);
    const { result: vpnResult = {}, loading: vpnLoading, fetch: fetchUserVPN } = useUserVPN();
    const [{ hasPaidVpn }] = useUser();
    const { VPN: userVPN = {} } = vpnResult;
    const isBasicVPN = userVPN.PlanName === 'vpnbasic';

    const downloadAllConfigs = async () => {
        const buffer = await request({
            Category: category === CATEGORY.FREE ? CATEGORY.SERVER : category,
            Platform: platform,
            Protocol: protocol,
            Tier: userVPN.PlanName === 'trial' || category === CATEGORY.FREE ? 0 : userVPN.MaxTier,
        });
        const blob = new Blob([buffer], { type: 'application/zip' });
        downloadFile(blob, 'ProtonVPN_server_configs.zip');
    };

    const servers = useMemo(
        () =>
            (result.LogicalServers || []).map((server) => {
                return {
                    ...server,
                    Country: getCountryByAbbr(correctAbbr(server.ExitCountry)),
                };
            }),
        [result.LogicalServers]
    );

    const { sortedList: allServers } = useSortedList(servers, { key: 'Country', direction: SORT_DIRECTION.ASC });

    const allCountries = [...new Set(allServers.map(({ Country }) => Country))];

    const configPerCountry = allServers.map(({ Country }) => Country);

    const isUpgradeRequiredForSecureCore = () => !Object.keys(userVPN).length || !hasPaidVpn || isBasicVPN;
    const isUpgradeRequiredForCountries = () => !Object.keys(userVPN).length || !hasPaidVpn;
    const isUpgradeRequiredForDownloadAll =
        !Object.keys(userVPN).length ||
        (!hasPaidVpn && ![CATEGORY.SERVER, CATEGORY.FREE].includes(category)) ||
        (isBasicVPN && category === CATEGORY.SECURE_CORE);

    const setServers = (country) => {
        const secureCoreServersCurrent = allServers.filter(
            ({ Features, Country }) => isSecureCoreEnabled(Features) && Country === country
        );

        const freeServersCurrent = allServers
            .filter(({ Tier, Country }) => Tier === 0 && Country === country)
            .map((server) => ({ ...server, open: true }));

        const standardServersCurrent = allServers.filter(({ Country }) => Country === country);

        setSecureCoreServers(secureCoreServersCurrent);
        setStandardServers(standardServersCurrent);
        setFreeServers(freeServersCurrent);
    };

    const handleChangeCountry = async (targetCountry) => {
        setCountry(targetCountry);
        setServers(targetCountry);
    };

    const handleChangeConfig = async (config) => {
        setConfiguration(config);
        setCategory(CONFIGURATION_OPTIONS.find((cf) => cf.name === config).category);
        setServers(countrySelected);
    };

    useEffect(() => {
        if (!hasPaidVpn || userVPN.PlanName === 'trial') {
            setCategory(CATEGORY.FREE);
        }
    }, [vpnLoading]);

    useEffect(() => {
        fetchUserVPN();
    }, [hasPaidVpn]);

    return (
        <>
            <SettingsParagraph>
                {c('Info').t`Use this section to generate config files for third party VPN clients
                    or when setting up a connection on a router. If you use a native ProtonVPN
                    client to connect, you do not need to manually handle these configuration files.
                `}
            </SettingsParagraph>
            <SettingsParagraph>
                {c('Info').t`
                    Do not use the OpenVPN / IKEv2 credentials in ProtonVPN applications or on the ProtonVPN dashboard.`}
            </SettingsParagraph>
            <SettingsLayout>
                <SettingsLayoutLeft className="flex">
                    <span>1.Select Country</span>
                    <span>
                        <Info buttonClass="ml0-5" title={c('Tooltip').t`Test `} />
                    </span>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <Select
                        id="countrySelect"
                        value={countrySelected}
                        options={allCountries.map((cntr) => ({ text: cntr, value: cntr }))}
                        onChange={({ target }) => handleChangeCountry(target.value)}
                        loading={loading}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout>
                <SettingsLayoutLeft className="flex">
                    <span>2.Select configuration</span>
                    <span>
                        <Info buttonClass="ml0-5" title={c('Tooltip').t`Test `} />
                    </span>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <Select
                        id="configurationSelect"
                        value={configurationSelected}
                        options={CONFIGURATION_OPTIONS.map((cnfg) => ({
                            text: cnfg.name,
                            value: cnfg.name,
                        }))}
                        onChange={({ target }) => handleChangeConfig(target.value)}
                        loading={loading}
                    />
                </SettingsLayoutRight>
            </SettingsLayout>
            <SettingsLayout>
                <SettingsLayoutLeft className="flex">
                    <span>3.Download configuration file</span>
                    <span>
                        <Info buttonClass="ml0-5" title={c('Tooltip').t`Test `} />
                    </span>
                </SettingsLayoutLeft>
            </SettingsLayout>
            <Block>
                {category === CATEGORY.SECURE_CORE && (
                    <>
                        <ConfigsTable
                            category={CATEGORY.SECURE_CORE}
                            isUpgradeRequired={isUpgradeRequiredForSecureCore}
                            platform={platform}
                            protocol={protocol}
                            loading={loading}
                            servers={secureCoreServers}
                        />
                    </>
                )}
                {category === CATEGORY.FREE && (
                    <>
                        <ServerConfigs
                            category={CATEGORY.FREE}
                            platform={platform}
                            protocol={protocol}
                            loading={loading}
                            servers={freeServers}
                        />
                    </>
                )}
                {category === CATEGORY.SERVER && (
                    <>
                        <ServerConfigs
                            category={CATEGORY.SERVER}
                            platform={platform}
                            protocol={protocol}
                            loading={loading}
                            servers={standardServers}
                        />
                    </>
                )}
            </Block>
        </>
    );
};

export default ProtonAccountOpenVpnConfigurationFiles;
