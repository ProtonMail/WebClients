import { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { c, msgid } from 'ttag';
import { getVPNServerConfig } from '@proton/shared/lib/api/vpn';
import { groupWith } from '@proton/shared/lib/helpers/array';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { PLANS, SORT_DIRECTION, VPN_APP_NAME, VPN_CONNECTIONS, VPN_HOSTNAME } from '@proton/shared/lib/constants';

import {
    Href,
    Button,
    ButtonLike,
    Icon,
    Info,
    Block,
    Tooltip,
    Radio,
    RadioGroup,
    SettingsLink,
} from '../../../components';
import { useApiWithoutResult, useUser, useSortedList, useUserVPN, usePlans, useVPNLogicals } from '../../../hooks';
import { getCountryByAbbr, correctAbbr } from '../../../helpers/countries';
import ServerConfigs from './ServerConfigs';
import { isSecureCoreEnabled } from './utils';
import ConfigsTable, { CATEGORY } from './ConfigsTable';
import { SettingsParagraph } from '../../account';

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

const OpenVPNConfigurationSection = ({ onSelect, selecting, listOnly = false, excludedCategories = [] }) => {
    const [platform, setPlatform] = useState(PLATFORM.ANDROID);
    const [protocol, setProtocol] = useState(PROTOCOL.UDP);
    const { request } = useApiWithoutResult(getVPNServerConfig);
    const [plans, loadingPlans] = usePlans();
    const { loading, result = {}, fetch: fetchLogicals } = useVPNLogicals();
    const { result: vpnResult, loading: vpnLoading, fetch: fetchUserVPN } = useUserVPN();
    const [{ hasPaidVpn }] = useUser();
    const userVPN = vpnResult?.VPN || {};
    const isBasicVPN = userVPN?.PlanName === PLANS.VPNBASIC;
    const maxTier = userVPN?.MaxTier || 0;
    const [category, setCategory] = useState(CATEGORY.FREE);
    const excludeCategoryMap = excludedCategories.reduce((map, excludedCategory) => {
        map[excludedCategory] = true;

        return map;
    }, {});

    if (maxTier) {
        excludeCategoryMap[CATEGORY.FREE] = true;
    }

    const selectedCategory = maxTier && category === CATEGORY.FREE ? CATEGORY.SERVER : category;

    const downloadAllConfigs = async () => {
        const freeSelected = selectedCategory === CATEGORY.FREE;
        const buffer = await request({
            Category: freeSelected ? CATEGORY.SERVER : selectedCategory,
            Platform: platform,
            Protocol: protocol,
            Tier: freeSelected ? 0 : maxTier,
        });
        const blob = new Blob([buffer], { type: 'application/zip' });
        downloadFile(blob, 'ProtonVPN_server_configs.zip');
    };

    const servers = useMemo(
        () =>
            (result.LogicalServers || []).map((server) => ({
                ...server,
                Country: getCountryByAbbr(correctAbbr(server.ExitCountry)),
            })),
        [result.LogicalServers]
    );

    const { sortedList: allServers } = useSortedList(servers, { key: 'Country', direction: SORT_DIRECTION.ASC });

    const isUpgradeRequiredForSecureCore = !Object.keys(userVPN).length || !hasPaidVpn || isBasicVPN;
    const isUpgradeRequiredForCountries = !Object.keys(userVPN).length || !hasPaidVpn;
    const isUpgradeRequiredForDownloadAll =
        !Object.keys(userVPN).length ||
        (!hasPaidVpn && ![CATEGORY.SERVER, CATEGORY.FREE].includes(selectedCategory)) ||
        (isBasicVPN && selectedCategory === CATEGORY.SECURE_CORE);

    const secureCoreServers = useMemo(() => {
        return allServers
            .filter(({ Features }) => isSecureCoreEnabled(Features))
            .map((server) => {
                return {
                    ...server,
                    isUpgradeRequired: isUpgradeRequiredForSecureCore,
                };
            });
    }, [allServers, isUpgradeRequiredForSecureCore]);

    const countryServers = groupWith(
        (a, b) => a.ExitCountry === b.ExitCountry,
        allServers.filter(({ Tier }) => Tier === 2)
    ).map((groups) => {
        const [first] = groups;
        const activeServers = groups.filter(({ Status }) => Status === 1);
        const load = activeServers.reduce((acc, { Load }) => acc + Load, 0) / activeServers.length;
        return {
            ...first,
            isUpgradeRequired: isUpgradeRequiredForCountries,
            Load: Number.isNaN(load) ? 0 : Math.round(load),
            Domain: `${first.EntryCountry.toLowerCase()}.protonvpn.net`, // Forging domain
            Servers: groups.reduce((acc, { Servers = [] }) => {
                acc.push(...Servers);
                return acc;
            }, []),
        };
    });

    const freeServers = useMemo(() => {
        return allServers.filter(({ Tier }) => Tier === 0).map((server) => ({ ...server, open: true }));
    }, [allServers]);

    useEffect(() => {
        if (!hasPaidVpn || userVPN.PlanName === 'trial') {
            setCategory(CATEGORY.FREE);
        }
    }, [vpnLoading]);

    useEffect(() => {
        fetchUserVPN(30_000);
    }, [hasPaidVpn]);

    useEffect(() => {
        fetchLogicals(30_000);
    }, []);

    const vpnPlan = plans?.find(({ Name }) => Name === PLANS.VPN);
    const plusVpnConnections = vpnPlan?.MaxVPN || VPN_CONNECTIONS;

    const vpnPlus = vpnPlan?.Title;
    const vpnBasic = `${VPN_APP_NAME} Basic`;
    const visionary = 'Visionary';

    return (
        <>
            {!vpnLoading && (
                <>
                    {!listOnly && (
                        <>
                            <SettingsParagraph>
                                {c('Info')
                                    .t`These configuration files let you choose which ${VPN_APP_NAME} server you connect to when using a third-party VPN app or setting up a VPN connection on a router.
                        `}
                            </SettingsParagraph>
                            <h3 className="mt2">{c('Title').t`1. Select platform`}</h3>
                            <div className="flex on-mobile-flex-column">
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
                                        <div key={value} className="mr2 mb1">
                                            <Radio
                                                onChange={() => setPlatform(value)}
                                                checked={platform === value}
                                                name="platform"
                                                className="flex inline-flex-vcenter mb0-5"
                                            >
                                                {label}
                                            </Radio>
                                            <Href
                                                url={link}
                                                className="text-sm m0 block ml-custom"
                                                style={{ '--padding-left-custom': `1.312rem` }}
                                            >{c('Link').t`View guide`}</Href>
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
                        </>
                    )}
                    <div className="flex on-mobile-flex-column mb1-5">
                        <RadioGroup
                            name={'category' + (listOnly ? '-list' : '')}
                            value={selectedCategory}
                            onChange={setCategory}
                            options={[
                                { value: CATEGORY.COUNTRY, label: c('Option').t`Country configs` },
                                { value: CATEGORY.SERVER, label: c('Option').t`Standard server configs` },
                                { value: CATEGORY.FREE, label: c('Option').t`Free server configs` },
                                { value: CATEGORY.SECURE_CORE, label: c('Option').t`Secure Core configs` },
                            ].filter((option) => !excludeCategoryMap[option.value])}
                        />
                    </div>
                </>
            )}
            <Block>
                {selectedCategory === CATEGORY.SECURE_CORE && (
                    <>
                        <SettingsParagraph learnMoreUrl="https://protonvpn.com/support/secure-core-vpn">
                            {c('Info')
                                .t`Install a Secure Core configuration file to benefit from an additional protection against VPN endpoint compromise.`}
                        </SettingsParagraph>
                        {isUpgradeRequiredForSecureCore && (
                            <SettingsParagraph>
                                <span className="block">{c('Info')
                                    .t`${vpnPlus} or ${visionary} required for Secure Core feature.`}</span>
                                <SettingsLink path="/upgrade">{c('Link').t`Learn more`}</SettingsLink>
                            </SettingsParagraph>
                        )}
                        <ConfigsTable
                            category={CATEGORY.SECURE_CORE}
                            platform={platform}
                            protocol={protocol}
                            loading={loading}
                            servers={secureCoreServers}
                            onSelect={onSelect}
                            selecting={selecting}
                        />
                    </>
                )}
                {selectedCategory === CATEGORY.COUNTRY && (
                    <>
                        {!listOnly && (
                            <SettingsParagraph>
                                {c('Info')
                                    .t`Install a Country configuration file to connect to a random server in the country of your choice.`}
                            </SettingsParagraph>
                        )}
                        {isUpgradeRequiredForCountries && (
                            <SettingsParagraph learnMoreUrl={`https://${VPN_HOSTNAME}/dashboard`}>{c('Info')
                                .t`${vpnBasic}, ${vpnPlus} or ${visionary} required for Country level connection.`}</SettingsParagraph>
                        )}
                        <ConfigsTable
                            category={CATEGORY.COUNTRY}
                            platform={platform}
                            protocol={protocol}
                            loading={loading}
                            servers={countryServers}
                            onSelect={onSelect}
                            selecting={selecting}
                        />
                    </>
                )}
                {selectedCategory === CATEGORY.SERVER && (
                    <>
                        {!listOnly && (
                            <SettingsParagraph>{c('Info')
                                .t`Install a Server configuration file to connect to a specific server in the country of your choice.`}</SettingsParagraph>
                        )}
                        <ServerConfigs
                            category={selectedCategory}
                            platform={platform}
                            protocol={protocol}
                            loading={loading}
                            servers={allServers}
                            select={onSelect}
                            selecting={selecting}
                        />
                    </>
                )}
                {selectedCategory === CATEGORY.FREE && (
                    <>
                        {!listOnly && (
                            <SettingsParagraph>
                                {c('Info')
                                    .t`Install a Free server configuration file to connect to a specific server in one of the three free locations.`}
                            </SettingsParagraph>
                        )}
                        <ServerConfigs
                            category={selectedCategory}
                            platform={platform}
                            protocol={protocol}
                            loading={loading}
                            servers={freeServers}
                            select={onSelect}
                            selecting={selecting}
                        />
                    </>
                )}
                {!listOnly && (
                    <>
                        <div className="mb2">
                            {isUpgradeRequiredForDownloadAll ? (
                                <Tooltip title={c('Info').t`Plan upgrade required`}>
                                    <Button loading={vpnLoading} disabled>{c('Action')
                                        .t`Download all configurations`}</Button>
                                </Tooltip>
                            ) : (
                                <Button loading={vpnLoading} onClick={() => downloadAllConfigs()}>{c('Action')
                                    .t`Download all configurations`}</Button>
                            )}
                        </div>
                        {!loadingPlans && (userVPN.PlanName === 'trial' || !hasPaidVpn) && vpnPlus && (
                            <div className="border p2 text-center">
                                <h3 className="color-primary mt0 mb1">{c('Title')
                                    .t`Get ${vpnPlus} to access all servers`}</h3>
                                <ul className="unstyled inline-flex mt0 mb2 on-mobile-flex-column">
                                    <li className="flex flex-nowrap flex-align-items-center mr1">
                                        <Icon name="checkmark" className="color-success mr0-5" />
                                        <span className="text-bold">{c('Feature').t`Access to all countries`}</span>
                                    </li>
                                    <li className="flex flex-nowrap flex-align-items-center mr1">
                                        <Icon name="checkmark" className="color-success mr0-5" />
                                        <span className="text-bold">{c('Feature').t`Secure Core servers`}</span>
                                    </li>
                                    <li className="flex flex-nowrap flex-align-items-center mr1">
                                        <Icon name="checkmark" className="color-success mr0-5" />
                                        <span className="text-bold">{c('Feature').t`Fastest VPN servers`}</span>
                                    </li>
                                    <li className="flex flex-nowrap flex-align-items-center mr1">
                                        <Icon name="checkmark" className="color-success mr0-5" />
                                        <span className="text-bold">{c('Feature').t`Torrenting support (P2P)`}</span>
                                    </li>
                                    <li className="flex flex-nowrap flex-align-items-center mr1">
                                        <Icon name="checkmark" className="color-success mr0-5" />
                                        <span className="text-bold">
                                            {c('Feature').ngettext(
                                                msgid`Connection for up to ${plusVpnConnections} device`,
                                                `Connection for up to ${plusVpnConnections} devices`,
                                                plusVpnConnections
                                            )}
                                        </span>
                                    </li>
                                    <li className="flex flex-nowrap flex-align-items-center ">
                                        <Icon name="checkmark" className="color-success mr0-5" />
                                        <span className="text-bold mr0-5">{c('Feature')
                                            .t`Secure streaming support`}</span>
                                        <Info
                                            url="https://protonvpn.com/support/streaming-guide/"
                                            title={c('VPN info')
                                                .t`Netflix, Amazon Prime Video, BBC iPlayer, ESPN+, Disney+, HBO Now, and more.`}
                                        />
                                    </li>
                                </ul>
                                <div>
                                    <ButtonLike as={SettingsLink} color="norm" path={`/dashboard?plan=${PLANS.VPN}`}>
                                        {c('Action').t`Get ${vpnPlus}`}
                                    </ButtonLike>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Block>
        </>
    );
};

OpenVPNConfigurationSection.propTypes = {
    onSelect: PropTypes.func,
    selecting: PropTypes.bool,
    listOnly: PropTypes.bool,
    excludedCategories: PropTypes.arrayOf(
        PropTypes.oneOf([CATEGORY.SECURE_CORE, CATEGORY.COUNTRY, CATEGORY.SERVER, CATEGORY.FREE])
    ),
};

export default OpenVPNConfigurationSection;
