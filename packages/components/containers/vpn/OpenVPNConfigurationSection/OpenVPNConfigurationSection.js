import React, { useState, useMemo, useEffect } from 'react';
import { c } from 'ttag';
import { queryVPNLogicalServerInfo, getVPNServerConfig } from 'proton-shared/lib/api/vpn';
import { groupWith } from 'proton-shared/lib/helpers/array';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { SORT_DIRECTION } from 'proton-shared/lib/constants';
import { Link } from 'react-router-dom';
import { Alert, Href, Icon, Info, Button, Block, Tooltip, Radio, RadioGroup, ButtonLike } from '../../../components';
import { useApiResult, useApiWithoutResult, useUser, useSortedList, useUserVPN } from '../../../hooks';
import { getCountryByAbbr, correctAbbr } from '../../../helpers/countries';
import ServerConfigs from './ServerConfigs';
import { isSecureCoreEnabled } from './utils';
import ConfigsTable, { CATEGORY } from './ConfigsTable';

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

const OpenVPNConfigurationSection = () => {
    const [platform, setPlatform] = useState(PLATFORM.ANDROID);
    const [protocol, setProtocol] = useState(PROTOCOL.UDP);
    const [category, setCategory] = useState(CATEGORY.SECURE_CORE);
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

    const secureCoreServers = allServers.filter(({ Features }) => isSecureCoreEnabled(Features));
    const countryServers = groupWith(
        (a, b) => a.ExitCountry === b.ExitCountry,
        allServers.filter(({ Tier }) => Tier === 1)
    ).map((groups) => {
        const [first] = groups;
        const activeServers = groups.filter(({ Status }) => Status === 1);
        const load = activeServers.reduce((acc, { Load }) => acc + Load, 0) / activeServers.length;
        return {
            ...first,
            Load: Number.isNaN(load) ? 0 : Math.round(load),
            Domain: `${first.EntryCountry.toLowerCase()}.protonvpn.com`, // Forging domain
            Servers: groups.reduce((acc, { Servers = [] }) => {
                acc.push(...Servers);
                return acc;
            }, []),
        };
    });
    const freeServers = allServers.filter(({ Tier }) => Tier === 0).map((server) => ({ ...server, open: true }));

    const isUpgradeRequiredForSecureCore = () => !Object.keys(userVPN).length || !hasPaidVpn || isBasicVPN;
    const isUpgradeRequiredForCountries = () => !Object.keys(userVPN).length || !hasPaidVpn;
    const isUpgradeRequiredForDownloadAll =
        !Object.keys(userVPN).length ||
        (!hasPaidVpn && ![CATEGORY.SERVER, CATEGORY.FREE].includes(category)) ||
        (isBasicVPN && category === CATEGORY.SECURE_CORE);

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
            <Alert>
                {c('Info').t`Use this section to generate config files for third party VPN clients
                    or when setting up a connection on a router. If you use a native ProtonVPN
                    client to connect, you do not need to manually handle these configuration files.
                `}
            </Alert>

            <h3 className="mt2">{c('Title').t`1. Select platform`}</h3>
            <div className="flex on-mobile-flex-column mb1">
                {[
                    {
                        value: PLATFORM.ANDROID,
                        link: 'https://protonvpn.com/support/android-vpn-setup/',
                        label: c('Option').t`Android`,
                    },
                    {
                        value: PLATFORM.IOS,
                        link: 'https://protonvpn.com/support/ios-vpn-setup/',
                        label: c('Option').t`iOS`,
                    },
                    {
                        value: PLATFORM.WINDOWS,
                        link: 'https://protonvpn.com/support/openvpn-windows-setup/',
                        label: c('Option').t`Windows`,
                    },
                    {
                        value: PLATFORM.MACOS,
                        link: 'https://protonvpn.com/support/mac-vpn-setup/',
                        label: c('Option').t`macOS`,
                    },
                    {
                        value: PLATFORM.LINUX,
                        link: 'https://protonvpn.com/support/linux-vpn-setup/',
                        label: c('Option').t`GNU/Linux`,
                    },
                    {
                        value: PLATFORM.ROUTER,
                        link: 'https://protonvpn.com/support/installing-protonvpn-on-a-router/',
                        label: c('Option').t`Router`,
                    },
                ].map(({ value, label, link }) => {
                    return (
                        <div key={value} className="mr2">
                            <Radio
                                onChange={() => setPlatform(value)}
                                checked={platform === value}
                                name="platform"
                                className="flex inline-flex-vcenter mb0-5"
                            >
                                {label}
                            </Radio>
                            <Href url={link} className="text-sm m0 block" style={{ paddingLeft: '1.312rem' }}>{c('Link')
                                .t`View guide`}</Href>
                        </div>
                    );
                })}
            </div>

            <h3 className="mt2">{c('Title').t`2. Select protocol`}</h3>
            <div className="flex on-mobile-flex-column mb0-5">
                <RadioGroup
                    name="protocol"
                    value={protocol}
                    onChange={setProtocol}
                    options={[
                        { value: PROTOCOL.UDP, label: c('Option').t`UDP` },
                        { value: PROTOCOL.TCP, label: c('Option').t`TCP` },
                    ]}
                />
            </div>
            <div className="mb1">
                <Href url="https://protonvpn.com/support/udp-tcp/" className="text-sm m0">{c('Link')
                    .t`What is the difference between UDP and TCP protocols?`}</Href>
            </div>

            <h3 className="mt2">{c('Title').t`3. Select config file and download`}</h3>
            <div className="flex on-mobile-flex-column mb1-5">
                <RadioGroup
                    name="category"
                    value={category}
                    onChange={setCategory}
                    options={[
                        { value: CATEGORY.SECURE_CORE, label: c('Option').t`Secure Core configs` },
                        { value: CATEGORY.COUNTRY, label: c('Option').t`Country configs` },
                        { value: CATEGORY.SERVER, label: c('Option').t`Standard server configs` },
                        { value: CATEGORY.FREE, label: c('Option').t`Free server configs` },
                    ]}
                />
            </div>
            <Block>
                {category === CATEGORY.SECURE_CORE && (
                    <>
                        <Alert learnMore="https://protonvpn.com/support/secure-core-vpn">
                            {c('Info')
                                .t`Install a Secure Core configuration file to benefit from an additional protection against VPN endpoint compromise.`}
                        </Alert>
                        {isUpgradeRequiredForSecureCore() && (
                            <Alert>
                                <div>{c('Info').t`ProtonVPN Plus or Visionary required for Secure Core feature.`}</div>
                                <Link to="/dashboard">{c('Link').t`Learn more`}</Link>
                            </Alert>
                        )}
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
                {category === CATEGORY.COUNTRY && (
                    <>
                        <Alert>
                            {c('Info')
                                .t`Install a Country configuration file to connect to a random server in the country of your choice.`}
                        </Alert>
                        {isUpgradeRequiredForCountries() && (
                            <Alert learnMore="https://account.protonvpn.com/dashboard">{c('Info')
                                .t`ProtonVPN Basic, Plus or Visionary required for Country level connection.`}</Alert>
                        )}
                        <ConfigsTable
                            category={CATEGORY.COUNTRY}
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
                        <Alert>{c('Info')
                            .t`Install a Server configuration file to connect to a specific server in the country of your choice.`}</Alert>
                        <ServerConfigs
                            category={category}
                            platform={platform}
                            protocol={protocol}
                            loading={loading}
                            servers={allServers}
                        />
                    </>
                )}
                {category === CATEGORY.FREE && (
                    <>
                        <Alert>{c('Info')
                            .t`Install a Free server configuration file to connect to a specific server in one of the three free locations.`}</Alert>
                        <ServerConfigs
                            category={category}
                            platform={platform}
                            protocol={protocol}
                            loading={loading}
                            servers={freeServers}
                        />
                    </>
                )}
                <div className="mb2">
                    {isUpgradeRequiredForDownloadAll ? (
                        <Tooltip title={c('Info').t`Plan upgrade required`}>
                            <Button loading={vpnLoading} disabled>{c('Action').t`Download all configurations`}</Button>
                        </Tooltip>
                    ) : (
                        <Button loading={vpnLoading} onClick={() => downloadAllConfigs()}>{c('Action')
                            .t`Download all configurations`}</Button>
                    )}
                </div>
                {userVPN.PlanName === 'trial' || !hasPaidVpn ? (
                    <div className="bordered p2 text-center">
                        <h3 className="color-primary mt0 mb1">{c('Title')
                            .t`Get ProtonVPN Plus to access all servers`}</h3>
                        <ul className="unstyled inline-flex mt0 mb2 on-mobile-flex-column">
                            <li className="flex flex-nowrap flex-align-items-center mr1">
                                <Icon name="on" className="color-success mr0-5" />
                                <span className="text-bold">{c('Feature').t`Access to all countries`}</span>
                            </li>
                            <li className="flex flex-nowrap flex-align-items-center mr1">
                                <Icon name="on" className="color-success mr0-5" />
                                <span className="text-bold">{c('Feature').t`Secure Core servers`}</span>
                            </li>
                            <li className="flex flex-nowrap flex-align-items-center mr1">
                                <Icon name="on" className="color-success mr0-5" />
                                <span className="text-bold">{c('Feature').t`Fastest VPN servers`}</span>
                            </li>
                            <li className="flex flex-nowrap flex-align-items-center mr1">
                                <Icon name="on" className="color-success mr0-5" />
                                <span className="text-bold">{c('Feature').t`Torrenting support (P2P)`}</span>
                            </li>
                            <li className="flex flex-nowrap flex-align-items-center mr1">
                                <Icon name="on" className="color-success mr0-5" />
                                <span className="text-bold">{c('Feature').t`Connection for up to 5 devices`}</span>
                            </li>
                            <li className="flex flex-nowrap flex-align-items-center ">
                                <Icon name="on" className="color-success mr0-5" />
                                <span className="text-bold mr0-5">{c('Feature').t`Secure streaming support`}</span>
                                <Info
                                    url="https://protonvpn.com/support/streaming-guide/"
                                    title={c('VPN info')
                                        .t`Netflix, Amazon Prime Video, BBC iPlayer, ESPN+, Disney+, HBO Now, and more.`}
                                />
                            </li>
                        </ul>
                        <div>
                            <ButtonLike as={Link} color="norm" to="/dashboard?plan=vpnplus">{c('Action')
                                .t`Get ProtonVPN Plus`}</ButtonLike>
                        </div>
                    </div>
                ) : null}
            </Block>
        </>
    );
};

export default OpenVPNConfigurationSection;
