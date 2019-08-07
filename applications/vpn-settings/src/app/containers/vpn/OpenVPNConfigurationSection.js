import React, { useState } from 'react';
import { c } from 'ttag';
import { Alert, Row, Radio, ButtonGroup, Group, useApiResult, SubTitle } from 'react-components';
import { queryVPNLogicalServerInfo } from 'proton-shared/lib/api/vpn';
import ConfigsTable from './ConfigsTable';
import { isSecureCoreEnabled } from './utils';
import { groupWith, minBy } from 'proton-shared/lib/helpers/array';
import { getCountryByAbbr } from 'react-components/helpers/countries';
import ServerConfigs from './ServerConfigs';

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

const CATEGORY = {
    SECURE_CORE: 'SecureCore',
    COUNTRY: 'Country',
    SERVER: 'Server'
};

// TODO: some options depend on users plan
// TODO: learn more link
// TODO: heading ids
const OpenVPNConfigurationSection = () => {
    const [platform, setPlatform] = useState(PLATFORM.MACOS);
    const [protocol, setProtocol] = useState(PROTOCOL.UDP);
    const [selectedConfig, selectConfig] = useState(CATEGORY.SECURE_CORE);
    const { loading, result = {} } = useApiResult(queryVPNLogicalServerInfo, []);

    // const downloadAllConfigs = ({ category }) => {
    //     const Tier = userAppModel.getTier();
    //     const link = Vpn.all({
    //         Category: category,
    //         Platform: CACHE.platform,
    //         Protocol: CACHE.protocol,
    //         APIVersion: CONFIG.api_version,
    //         Tier
    //     });
    //     console.log(link);
    //     window.open(link, '_blank');
    // }

    const handleSelectConfig = (option) => () => selectConfig(option);

    const allServers = (result.LogicalServers || []).map((server) => {
        // Server returns UK instead of GB
        const ExitCountry = server.ExitCountry === 'UK' ? 'GB' : server.ExitCountry;
        const EntryCountry = server.EntryCountry === 'UK' ? 'GB' : server.EntryCountry;
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

    return (
        <>
            <SubTitle>{c('Title').t`OpenVPN Configuration Files`}</SubTitle>
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
                    id="platform-macos"
                >{c('Option').t`MacOS`}</Radio>
                <Radio
                    onChange={handleChangePlatform(PLATFORM.LINUX)}
                    checked={platform === PLATFORM.LINUX}
                    name="platform"
                    className="mr2"
                    id="platform-linux"
                >{c('Option').t`Linux`}</Radio>
                <Radio
                    onChange={handleChangePlatform(PLATFORM.WINDOWS)}
                    checked={platform === PLATFORM.WINDOWS}
                    name="platform"
                    className="mr2"
                    id="platform-windows"
                >{c('Option').t`Windows`}</Radio>
                <Radio
                    onChange={handleChangePlatform(PLATFORM.ANDROID)}
                    checked={platform === PLATFORM.ANDROID}
                    name="platform"
                    className="mr2"
                    id="platform-android"
                >{c('Option').t`Android`}</Radio>
                <Radio
                    onChange={handleChangePlatform(PLATFORM.IOS)}
                    checked={platform === PLATFORM.IOS}
                    name="platform"
                    className="mr2"
                    id="platform-ios"
                >{c('Option').t`iOS`}</Radio>
                <Radio
                    onChange={handleChangePlatform(PLATFORM.ROUTER)}
                    checked={platform === PLATFORM.ROUTER}
                    name="platform"
                    className="mr2"
                    id="platform-router"
                >{c('Option').t`Router`}</Radio>
            </Row>

            <h3 className="mt2">{c('Title').t`2. Select protocol`}</h3>
            <Row>
                <Radio
                    onChange={handleChangeProtocol(PROTOCOL.UDP)}
                    checked={protocol === PROTOCOL.UDP}
                    name="protocol"
                    className="mr2"
                    id="protocol-udp"
                >{c('Option').t`UDP`}</Radio>
                <Radio
                    onChange={handleChangeProtocol(PROTOCOL.TCP)}
                    checked={protocol === PROTOCOL.TCP}
                    name="protocol"
                    className="mr2"
                    id="protocol-tcp"
                >{c('Option').t`TCP`}</Radio>
            </Row>

            <h3 className="mt2">{c('Title').t`3. Select connection and download`}</h3>
            <Group className="mb1-5">
                <ButtonGroup
                    onClick={handleSelectConfig(CATEGORY.SECURE_CORE)}
                    disabled={selectedConfig === CATEGORY.SECURE_CORE}
                >{c('Tab').t`Secure Core Configs`}</ButtonGroup>
                <ButtonGroup
                    onClick={handleSelectConfig(CATEGORY.COUNTRY)}
                    disabled={selectedConfig === CATEGORY.COUNTRY}
                >{c('Tab').t`Country Configs`}</ButtonGroup>
                <ButtonGroup
                    onClick={handleSelectConfig(CATEGORY.SERVER)}
                    disabled={selectedConfig === CATEGORY.SERVER}
                >{c('Tab').t`Server Configs`}</ButtonGroup>
            </Group>

            <h3>{c('Title').t`Secure Core Configs`}</h3>
            <Alert learnMore="todo">
                {c('Info').t`Secure Core configurations add additional protection against VPN endpoint compromise.`}
            </Alert>

            {selectedConfig === CATEGORY.SECURE_CORE && (
                <ConfigsTable platform={platform} protocol={protocol} loading={loading} servers={secureCoreServers} />
            )}
            {selectedConfig === CATEGORY.COUNTRY && (
                <ConfigsTable platform={platform} protocol={protocol} loading={loading} servers={countryServers} />
            )}
            {selectedConfig === CATEGORY.SERVER && (
                <ServerConfigs platform={platform} protocol={protocol} loading={loading} servers={allServers} />
            )}
        </>
    );
};

export default OpenVPNConfigurationSection;
