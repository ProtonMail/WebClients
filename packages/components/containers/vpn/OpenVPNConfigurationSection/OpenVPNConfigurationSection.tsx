import { useCallback, useEffect, useMemo, useState } from 'react';

import groupBy from 'lodash/groupBy';
import { c, msgid } from 'ttag';

import { ButtonLike, Href } from '@proton/atoms';
import { SettingsSectionWide } from '@proton/components/containers';
import type { EnhancedLogical } from '@proton/components/containers/vpn/OpenVPNConfigurationSection/interface';
import { PLANS, SORT_DIRECTION, VPN_APP_NAME, VPN_CONNECTIONS, VPN_HOSTNAME } from '@proton/shared/lib/constants';
import type { Logical } from '@proton/shared/lib/vpn/Logical';

import { Block, Icon, Info, Radio, RadioGroup, SettingsLink } from '../../../components';
import {
    type CountryOptions,
    correctAbbr,
    getCountryOptions,
    getLocalizedCountryByAbbr,
} from '../../../helpers/countries';
import { usePlans, useSortedList, useUser, useUserSettings, useUserVPN, useVPNLogicals } from '../../../hooks';
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

interface Props {
    onSelect?: (logical: Logical) => void;
    selecting?: boolean;
    listOnly?: boolean;
    excludedCategories?: CATEGORY[];
    countryOptions?: CountryOptions;
}

const OpenVPNConfigurationSection = ({
    countryOptions: maybeCountryOptions,
    onSelect,
    selecting,
    listOnly = false,
    excludedCategories = [],
}: Props) => {
    const [platform, setPlatform] = useState(PLATFORM.ANDROID);
    const [protocol, setProtocol] = useState(PROTOCOL.UDP);
    const [plansResult, loadingPlans] = usePlans();
    const plans = plansResult?.plans || [];
    const { loading, result, fetch: fetchLogicals } = useVPNLogicals();
    const { result: vpnResult, loading: vpnLoading, fetch: fetchUserVPN } = useUserVPN();
    const [{ hasPaidVpn }] = useUser();
    const [userSettings] = useUserSettings();
    const userVPN = vpnResult?.VPN;
    const maxTier = userVPN?.MaxTier || 0;
    const [category, setCategory] = useState(CATEGORY.FREE);
    const excludeCategoryMap = excludedCategories.reduce<{ [key in CATEGORY]?: boolean }>((map, excludedCategory) => {
        map[excludedCategory] = true;
        return map;
    }, {});

    if (maxTier) {
        excludeCategoryMap[CATEGORY.FREE] = true;
    }

    const selectedCategory = maxTier && category === CATEGORY.FREE ? CATEGORY.SERVER : category;

    const countryOptions = maybeCountryOptions || getCountryOptions(userSettings);

    const getIsUpgradeRequired = useCallback(
        (server: Logical) => {
            return !userVPN || (!hasPaidVpn && server.Tier > 0);
        },
        [userVPN, hasPaidVpn]
    );

    const servers = useMemo((): EnhancedLogical[] => {
        return (result?.LogicalServers || []).map((server) => ({
            ...server,
            country: getLocalizedCountryByAbbr(correctAbbr(server.ExitCountry), countryOptions),
            isUpgradeRequired: getIsUpgradeRequired(server),
        }));
    }, [result?.LogicalServers, getIsUpgradeRequired]);

    const { sortedList: allServers } = useSortedList(servers, { key: 'country', direction: SORT_DIRECTION.ASC });

    const isUpgradeRequiredForSecureCore = !Object.keys(userVPN || {}).length || !hasPaidVpn;
    const isUpgradeRequiredForCountries = !Object.keys(userVPN || {}).length || !hasPaidVpn;

    useEffect(() => {
        fetchUserVPN(30_000);
    }, [hasPaidVpn]);

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

    const countryServers = useMemo(() => {
        return Object.values(
            groupBy(
                allServers.filter(({ Tier, Features }) => {
                    return Tier === 2 && !isSecureCoreEnabled(Features) && !isTorEnabled(Features);
                }),
                (a) => a.ExitCountry
            )
        ).map((groups) => {
            const [first] = groups;
            const activeServers = groups.filter(({ Status }) => Status === 1);
            const load = activeServers.reduce((acc, { Load }) => acc + (Load || 0), 0) / activeServers.length;
            return {
                ...first,
                isUpgradeRequired: isUpgradeRequiredForCountries,
                Load: Number.isNaN(load) ? 0 : Math.round(load),
                Domain: `${first.EntryCountry.toLowerCase()}.protonvpn.net`, // Forging domain
                Servers: groups.flatMap((logical) => logical.Servers || []),
            };
        });
    }, [allServers, isUpgradeRequiredForCountries]);

    const freeServers = useMemo(() => {
        return allServers.filter(({ Tier }) => Tier === 0);
    }, [allServers]);

    useEffect(() => {
        if (vpnLoading) {
            return;
        }
        if (!hasPaidVpn || userVPN?.PlanName === 'trial') {
            setCategory(CATEGORY.FREE);
        }
    }, [vpnLoading]);

    useEffect(() => {
        void fetchUserVPN(30_000);
    }, [hasPaidVpn]);

    useEffect(() => {
        void fetchLogicals(30_000);
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
                                                id={'platform-' + value}
                                                onChange={() => setPlatform(value)}
                                                checked={platform === value}
                                                name="platform"
                                                className="flex inline-flex *:self-center mb-2"
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
                            countryOptions={countryOptions}
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
                            countryOptions={countryOptions}
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
                            defaultOpen={false}
                            onSelect={onSelect}
                            selecting={selecting}
                            countryOptions={countryOptions}
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
                            countryOptions={countryOptions}
                            category={selectedCategory}
                            platform={platform}
                            protocol={protocol}
                            loading={loading}
                            servers={freeServers}
                            defaultOpen={true}
                            onSelect={onSelect}
                            selecting={selecting}
                        />
                    </>
                )}
                {!listOnly && (
                    <>
                        {!loadingPlans && (userVPN?.PlanName === 'trial' || !hasPaidVpn) && vpnPlus && (
                            <div className="border p-7 text-center">
                                <h3 className="color-primary mt-0 mb-4">{
                                    // translator: ${vpnPlus} is "VPN Plus" (taken from plan title)
                                    c('Title').t`Get ${vpnPlus} to access all servers`
                                }</h3>
                                <ul className="unstyled inline-flex mt-0 mb-8 flex-column md:flex-row">
                                    <li className="flex flex-nowrap items-center mr-4">
                                        <Icon name="checkmark" className="color-success mr-2" />
                                        <span className="text-bold">{c('Feature').t`Access to all countries`}</span>
                                    </li>
                                    <li className="flex flex-nowrap items-center mr-4">
                                        <Icon name="checkmark" className="color-success mr-2" />
                                        <span className="text-bold">{c('Feature').t`Secure Core servers`}</span>
                                    </li>
                                    <li className="flex flex-nowrap items-center mr-4">
                                        <Icon name="checkmark" className="color-success mr-2" />
                                        <span className="text-bold">{c('Feature').t`Fastest VPN servers`}</span>
                                    </li>
                                    <li className="flex flex-nowrap items-center mr-4">
                                        <Icon name="checkmark" className="color-success mr-2" />
                                        <span className="text-bold">{c('Feature').t`Torrenting support (P2P)`}</span>
                                    </li>
                                    <li className="flex flex-nowrap items-center mr-4">
                                        <Icon name="checkmark" className="color-success mr-2" />
                                        <span className="text-bold">
                                            {c('Feature').ngettext(
                                                msgid`Connection for up to ${plusVpnConnections} device`,
                                                `Connection for up to ${plusVpnConnections} devices`,
                                                plusVpnConnections
                                            )}
                                        </span>
                                    </li>
                                    <li className="flex flex-nowrap items-center ">
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
                                    <ButtonLike
                                        as={SettingsLink}
                                        color="norm"
                                        path={`/dashboard?plan=${PLANS.VPN2024}`}
                                    >
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

export default OpenVPNConfigurationSection;
