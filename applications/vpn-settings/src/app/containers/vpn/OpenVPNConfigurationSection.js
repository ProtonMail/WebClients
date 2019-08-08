import React, { useState } from 'react';
import { c } from 'ttag';
import {
    Alert,
    Row,
    Radio,
    ButtonGroup,
    Group,
    useApiResult,
    SubTitle,
    useApiWithoutResult,
    Button,
    Block,
    useUser,
    Tooltip
} from 'react-components';
import { queryVPNLogicalServerInfo, getVPNServerConfig } from 'proton-shared/lib/api/vpn';
import ConfigsTable, { CATEGORY } from './ConfigsTable';
import { isSecureCoreEnabled } from './utils';
import { groupWith, minBy } from 'proton-shared/lib/helpers/array';
import ServerConfigs from './ServerConfigs';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import useUserVPN from './userVPN/useUserVPN';
import { getCountryByAbbr } from 'react-components/helpers/countries';

const PLATFORM = {
    MACOS: 'macOS',
    LINUX: 'Linux',
    WINDOWS: 'Windows',
    ANDROID: 'Android',
    IOS: 'iOS',
    ROUTER: 'Router'
};

const PROTOCOL = {
    TCP: 'tcp',
    UDP: 'udp'
};

// TODO: learn more link
const OpenVPNConfigurationSection = () => {
    const [platform, setPlatform] = useState(PLATFORM.MACOS);
    const [protocol, setProtocol] = useState(PROTOCOL.UDP);
    const [category, setCategory] = useState(CATEGORY.SECURE_CORE);
    const { request } = useApiWithoutResult(getVPNServerConfig);
    const { loading, result = {} } = useApiResult(queryVPNLogicalServerInfo, []);
    const { loading: vpnLoading, tier, isBasic, userVPN } = useUserVPN();
    const { hasPaidVPN } = useUser();

    const downloadAllConfigs = async () => {
        const buffer = await request({
            Category: category,
            Platform: platform,
            Protocol: protocol,
            Tier: tier
        });
        const blob = new Blob([buffer], { type: 'application/zip' });
        downloadFile(blob, 'ProtonVPN_server_configs.zip');
    };

    const handleSelectConfig = (option) => () => setCategory(option);

    const allServers = (result.LogicalServers || []).map((server) => {
        // Server returns UK instead of GB
        const correctAbbr = (abbr) => (abbr === 'UK' ? 'GB' : abbr);
        const ExitCountry = correctAbbr(server.ExitCountry);
        const EntryCountry = correctAbbr(server.EntryCountry);
        return {
            ...server,
            Country: getCountryByAbbr(ExitCountry),
            ExitCountry,
            EntryCountry
        };
    });
    const secureCoreServers = allServers.filter(({ Features }) => isSecureCoreEnabled(Features));
    const countryServers = groupWith(
        (a, b) => a.ExitCountry === b.ExitCountry,
        allServers.filter(({ Tier }) => Tier === 1)
    ).map((groups) => minBy(({ Load }) => Number(Load), groups));

    const handleChangePlatform = (platform) => () => setPlatform(platform);
    const handleChangeProtocol = (protocol) => () => setProtocol(protocol);

    const isUpgradeRequiredForSecureCore = () => !userVPN || !hasPaidVPN || isBasic;
    const isUpgradeRequiredForCountries = () => !userVPN || !hasPaidVPN;
    const isUpgradeRequiredForDownloadAll =
        !userVPN || (!hasPaidVPN && category !== CATEGORY.SERVER) || (isBasic && category === CATEGORY.SECURE_CORE);

    return (
        <>
            <SubTitle id="openvpn-configuration-files">{c('Title').t`OpenVPN Configuration Files`}</SubTitle>
            <Alert learnMore="todo">
                {c('Info').t`Use this section to generate config files for third party VPN clients
                    or when setting up a connection on a router. If you use a native ProtonVPN
                    client to connect, you do not need to manually handle these configuration files.
                `}
            </Alert>

            <h3 className="mt2">{c('Title').t`1. Select platform`}</h3>
            <Row>
                <Radio
                    onChange={handleChangePlatform(PLATFORM.MACOS)}
                    checked={platform === PLATFORM.MACOS}
                    name="platform"
                    className="mr2"
                >{c('Option').t`MacOS`}</Radio>
                <Radio
                    onChange={handleChangePlatform(PLATFORM.LINUX)}
                    checked={platform === PLATFORM.LINUX}
                    name="platform"
                    className="mr2"
                >{c('Option').t`Linux`}</Radio>
                <Radio
                    onChange={handleChangePlatform(PLATFORM.WINDOWS)}
                    checked={platform === PLATFORM.WINDOWS}
                    name="platform"
                    className="mr2"
                >{c('Option').t`Windows`}</Radio>
                <Radio
                    onChange={handleChangePlatform(PLATFORM.ANDROID)}
                    checked={platform === PLATFORM.ANDROID}
                    name="platform"
                    className="mr2"
                >{c('Option').t`Android`}</Radio>
                <Radio
                    onChange={handleChangePlatform(PLATFORM.IOS)}
                    checked={platform === PLATFORM.IOS}
                    name="platform"
                    className="mr2"
                >{c('Option').t`iOS`}</Radio>
                <Radio
                    onChange={handleChangePlatform(PLATFORM.ROUTER)}
                    checked={platform === PLATFORM.ROUTER}
                    name="platform"
                    className="mr2"
                >{c('Option').t`Router`}</Radio>
            </Row>

            <h3 className="mt2">{c('Title').t`2. Select protocol`}</h3>
            <Row>
                <Radio
                    onChange={handleChangeProtocol(PROTOCOL.UDP)}
                    checked={protocol === PROTOCOL.UDP}
                    name="protocol"
                    className="mr2"
                >{c('Option').t`UDP`}</Radio>
                <Radio
                    onChange={handleChangeProtocol(PROTOCOL.TCP)}
                    checked={protocol === PROTOCOL.TCP}
                    name="protocol"
                    className="mr2"
                >{c('Option').t`TCP`}</Radio>
            </Row>

            <h3 className="mt2">{c('Title').t`3. Select connection and download`}</h3>
            <Group className="mb1-5">
                <ButtonGroup
                    onClick={handleSelectConfig(CATEGORY.SECURE_CORE)}
                    disabled={category === CATEGORY.SECURE_CORE}
                >{c('Tab').t`Secure Core Configs`}</ButtonGroup>
                <ButtonGroup onClick={handleSelectConfig(CATEGORY.COUNTRY)} disabled={category === CATEGORY.COUNTRY}>{c(
                    'Tab'
                ).t`Country Configs`}</ButtonGroup>
                <ButtonGroup onClick={handleSelectConfig(CATEGORY.SERVER)} disabled={category === CATEGORY.SERVER}>{c(
                    'Tab'
                ).t`Server Configs`}</ButtonGroup>
            </Group>

            <Block>
                {category === CATEGORY.SECURE_CORE && (
                    <>
                        <h3>{c('Title').t`Secure Core Configs`}</h3>
                        <Alert learnMore="todo">
                            {c('Info')
                                .t`Secure Core configurations add additional protection against VPN endpoint compromise.`}
                        </Alert>
                        {isUpgradeRequiredForSecureCore() && (
                            <Alert learnMore="https://account.protonvpn.com/dashboard">
                                {c('Info').t`ProtonVPN Plus or Visionary required for Secure Core feature.`}
                            </Alert>
                        )}
                        <ConfigsTable
                            isUpgradeRequired={isUpgradeRequiredForSecureCore}
                            platform={platform}
                            protocol={protocol}
                            loading={loading}
                            servers={secureCoreServers}
                        />
                    </>
                )}
                {category === CATEGORY.COUNTRY && (
                    <>
                        <h3>{c('Title').t`Country Configs`}</h3>
                        <Alert>
                            {c('Info')
                                .t`Country Connect configuration files ensure a faster connection to the selected country on average.`}
                        </Alert>
                        {isUpgradeRequiredForCountries() && (
                            <Alert learnMore="https://account.protonvpn.com/dashboard">{c('Info')
                                .t`ProtonVPN Basic, Plus or Visionary required for Country level connection.`}</Alert>
                        )}
                        <ConfigsTable
                            isUpgradeRequired={isUpgradeRequiredForCountries}
                            platform={platform}
                            protocol={protocol}
                            loading={loading}
                            servers={countryServers}
                        />
                    </>
                )}
                {category === CATEGORY.SERVER && (
                    <>
                        <h3>{c('Title').t`Server Configs`}</h3>
                        <Alert>{c('Info').t`Connect to a single server in the country of your choice.`}</Alert>
                        <ServerConfigs platform={platform} protocol={protocol} loading={loading} servers={allServers} />
                    </>
                )}
                {isUpgradeRequiredForDownloadAll ? (
                    <Tooltip title={c('Info').t`Plan upgrade required`}>
                        <Button loading={vpnLoading} disabled>{c('Action').t`Download All Configurations`}</Button>
                    </Tooltip>
                ) : (
                    <Button loading={vpnLoading} onClick={() => downloadAllConfigs()}>{c('Action')
                        .t`Download All Configurations`}</Button>
                )}
            </Block>
        </>
    );
};

export default OpenVPNConfigurationSection;
