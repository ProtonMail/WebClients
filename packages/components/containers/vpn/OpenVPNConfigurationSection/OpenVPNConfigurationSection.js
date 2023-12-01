import { useEffect, useMemo, useState } from 'react';

import PropTypes from 'prop-types';
import { c, msgid } from 'ttag';

import { Button, ButtonLike, Href } from '@proton/atoms';
import { SettingsSectionWide } from '@proton/components/containers';
import { getVPNServerConfig } from '@proton/shared/lib/api/vpn';
import { PLANS, SORT_DIRECTION, VPN_APP_NAME, VPN_CONNECTIONS, VPN_HOSTNAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import groupWith from '@proton/utils/groupWith';

import { Block, Icon, Info, Radio, RadioGroup, SettingsLink, Tooltip } from '../../../components';
import { correctAbbr, getLocalizedCountryByAbbr } from '../../../helpers/countries';
import {
    useApiWithoutResult,
    usePlans,
    useSortedList,
    useUser,
    useUserSettings,
    useUserVPN,
    useVPNLogicals,
} from '../../../hooks';
import { SettingsParagraph } from '../../account';
import ConfigsTable, { CATEGORY } from './ConfigsTable';
import ServerConfigs from './ServerConfigs';
import { isSecureCoreEnabled, isTorEnabled } from './utils';

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
    const [userSettings] = useUserSettings();
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
                Country: getLocalizedCountryByAbbr(
                    correctAbbr(server.ExitCountry),
                    userSettings.Locale || navigator.languages
                ),
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
        allServers.filter(
            ({ Tier, Features }) => Tier === 2 && !isSecureCoreEnabled(Features) && !isTorEnabled(Features)
        )
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

    return (
        <SettingsSectionWide>
            {!vpnLoading && (
                <>
                    {!listOnly && (
                        <>
                            <SettingsParagraph>
                                {c('Info')
                                    .t`These configuration files let you choose which ${VPN_APP_NAME} server you connect to when using a third-party VPN app or setting up a VPN connection on a router.
                        `}
                            </SettingsParagraph>
                            <h3 className="mt-8 mb-2">{c('Title').t`1. Select platform`}</h3>
                            <div className="flex flex-column md:flex-row">
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
                                        <div key={value} className="mr-8 mb-4">
                                            <Radio
                                                onChange={() => setPlatform(value)}
                                                checked={platform === value}
                                                name="platform"
                                                className="flex inline-flex-vcenter mb-2"
                                            >
                                                {label}
                                            </Radio>
                                            <Href
                                                href={link}
                                                className="text-sm m-0 block ml-custom"
                                                style={{ '--ml-custom': '1.75rem' }}
                                            >{c('Link').t`View guide`}</Href>
                                        </div>
                                    );
                                })}
                            </div>

                            <h3 className="mt-8 mb-2">{c('Title').t`2. Select protocol`}</h3>
                            <div className="flex flex-column md:flex-row mb-2">
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
                            <div className="mb-4">
                                <Href href="https://protonvpn.com/support/udp-tcp/" className="text-sm m-0">{c('Link')
                                    .t`What is the difference between UDP and TCP protocols?`}</Href>
                            </div>

                            <h3 className="mt-8 mb-2">{c('Title').t`3. Select config file and download`}</h3>
                        </>
                    )}
                    <div className="flex flex-column md:flex-row mb-6">
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
                                <span className="block">{
                                    // translator: ${vpnPlus} is "VPN Plus" (taken from plan title)
                                    c('Info').t`${vpnPlus} required for Secure Core feature.`
                                }</span>
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
                            <SettingsParagraph learnMoreUrl={`https://${VPN_HOSTNAME}/dashboard`}>{
                                // translator: ${vpnPlus} is "VPN Plus" (taken from plan title)
                                // translator: This notice appears when a free user go to "OpenVPN configuration files" section and select "Country configs'
                                c('Info').t`${vpnPlus} required for Country level connection.`
                            }</SettingsParagraph>
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
                        <div className="mb-8">
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
                            <div className="border p-7 text-center">
                                <h3 className="color-primary mt-0 mb-4">{
                                    // translator: ${vpnPlus} is "VPN Plus" (taken from plan title)
                                    c('Title').t`Get ${vpnPlus} to access all servers`
                                }</h3>
                                <ul className="unstyled inline-flex mt-0 mb-8 flex-column md:flex-row">
                                    <li className="flex flex-nowrap flex-align-items-center mr-4">
                                        <Icon name="checkmark" className="color-success mr-2" />
                                        <span className="text-bold">{c('Feature').t`Access to all countries`}</span>
                                    </li>
                                    <li className="flex flex-nowrap flex-align-items-center mr-4">
                                        <Icon name="checkmark" className="color-success mr-2" />
                                        <span className="text-bold">{c('Feature').t`Secure Core servers`}</span>
                                    </li>
                                    <li className="flex flex-nowrap flex-align-items-center mr-4">
                                        <Icon name="checkmark" className="color-success mr-2" />
                                        <span className="text-bold">{c('Feature').t`Fastest VPN servers`}</span>
                                    </li>
                                    <li className="flex flex-nowrap flex-align-items-center mr-4">
                                        <Icon name="checkmark" className="color-success mr-2" />
                                        <span className="text-bold">{c('Feature').t`Torrenting support (P2P)`}</span>
                                    </li>
                                    <li className="flex flex-nowrap flex-align-items-center mr-4">
                                        <Icon name="checkmark" className="color-success mr-2" />
                                        <span className="text-bold">
                                            {c('Feature').ngettext(
                                                msgid`Connection for up to ${plusVpnConnections} device`,
                                                `Connection for up to ${plusVpnConnections} devices`,
                                                plusVpnConnections
                                            )}
                                        </span>
                                    </li>
                                    <li className="flex flex-nowrap flex-align-items-center ">
                                        <Icon name="checkmark" className="color-success mr-2" />
                                        <span className="text-bold mr-2">{c('Feature')
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
                                        {
                                            // translator: ${vpnPlus} is "VPN Plus" (taken from plan title)
                                            c('Action').t`Get ${vpnPlus}`
                                        }
                                    </ButtonLike>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Block>
        </SettingsSectionWide>
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
