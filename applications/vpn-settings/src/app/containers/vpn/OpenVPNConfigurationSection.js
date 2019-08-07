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
    ObserverSection
} from 'react-components';
import { queryVPNLogicalServerInfo, getClientVPNInfo, getVPNServerConfig } from 'proton-shared/lib/api/vpn';
import ConfigsTable from './ConfigsTable';
import { isSecureCoreEnabled } from './utils';
import { groupWith, minBy } from 'proton-shared/lib/helpers/array';
import { getCountryByAbbr } from 'react-components/helpers/countries';
import ServerConfigs from './ServerConfigs';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';

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
    const { request } = useApiWithoutResult(getVPNServerConfig);
    const { loading, result = {} } = useApiResult(queryVPNLogicalServerInfo, []);

    // TODO: move to provider
    const { result: vpnResult = {} } = useApiResult(getClientVPNInfo, []);
    const vpnInfo = vpnResult.VPN;
    const isTrial = () => vpnInfo.PlanName === 'trial';
    const getTier = () => (isTrial() ? 0 : vpnInfo.MaxTier);

    const downloadAllConfigs = async () => {
        const buffer = await request({
            Category: selectedConfig,
            Platform: platform,
            Protocol: protocol,
            Tier: getTier()
        });
        const blob = new Blob([buffer], { type: 'application/zip' });
        downloadFile(blob, 'ProtonVPN_server_configs.zip');
    };

    const handleSelectConfig = (option) => () => selectConfig(option);

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

    return (
        <ObserverSection id="openvpn-configuration-files">
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

            <Block>
                {selectedConfig === CATEGORY.SECURE_CORE && (
                    <>
                        <h3>{c('Title').t`Secure Core Configs`}</h3>
                        <Alert learnMore="todo">
                            {c('Info')
                                .t`Secure Core configurations add additional protection against VPN endpoint compromise.`}
                        </Alert>
                        <ConfigsTable
                            platform={platform}
                            protocol={protocol}
                            loading={loading}
                            servers={secureCoreServers}
                        />
                    </>
                )}
                {selectedConfig === CATEGORY.COUNTRY && (
                    <>
                        <h3>{c('Title').t`Country Configs`}</h3>
                        <Alert>
                            {c('Info')
                                .t`Country Connect configuration files ensure a faster connection to the selected country on average.`}
                        </Alert>
                        <ConfigsTable
                            platform={platform}
                            protocol={protocol}
                            loading={loading}
                            servers={countryServers}
                        />
                    </>
                )}
                {selectedConfig === CATEGORY.SERVER && (
                    <>
                        <h3>{c('Title').t`Server Configs`}</h3>
                        <Alert>{c('Info').t`Connect to a single server in the country of your choice.`}</Alert>
                        <ServerConfigs platform={platform} protocol={protocol} loading={loading} servers={allServers} />
                    </>
                )}
                <Button onClick={() => downloadAllConfigs()}>{c('Action').t`Download All Configurations`}</Button>
            </Block>
        </ObserverSection>
    );
};

export default OpenVPNConfigurationSection;
