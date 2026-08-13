import { useMemo, useState } from 'react';

import groupBy from 'lodash/groupBy';
import { c } from 'ttag';

import { Banner } from '@proton/atoms/Banner/Banner';
import { Href } from '@proton/atoms/Href/Href';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';
import { type CountryOptions, getLocalizedCountryByAbbr } from '@proton/payments/core/countries';
import type { Logical } from '@proton/shared/lib/vpn/Logical';
import clsx from '@proton/utils/clsx';
import compare from '@proton/utils/compare';

import Details from '../../../components/container/Details';
import Summary from '../../../components/container/Summary';
import CityNumber from './CityNumber';
import ConfigsTable, { CATEGORY, P2PIcon, SmartRoutingIcon, TorIcon } from './ConfigsTable';
import Country from './Country';
import type { EnhancedLogical } from './interface';
import { isP2PEnabled, isSecureCoreEnabled, isSmartRouting, isTorEnabled } from './utils';

const getServerNum = (server: Logical) => Number(server.Name.replace('-TOR', '').split('#')[1]);
const getServerRegion = (server: Logical) => server.Name.split('#')[0];
const serverRegionAsc = (a: Logical, b: Logical) => compare(getServerRegion(a), getServerRegion(b));
const serverNumAsc = (a: Logical, b: Logical) => compare(getServerNum(a), getServerNum(b));
const serverNameAsc = (a: Logical, b: Logical) => serverRegionAsc(a, b) || serverNumAsc(a, b);

interface Props {
    servers: EnhancedLogical[];
    category: CATEGORY;
    onSelect?: (logical: Logical) => void;
    selecting?: boolean;
    countryOptions: CountryOptions;
    platform: string;
    protocol: string;
    loading?: boolean;
    defaultOpen: boolean;
}

const ServerConfigs = ({ servers, category, onSelect, selecting, countryOptions, defaultOpen, ...rest }: Props) => {
    const [openMap, setOpen] = useState<{ [key: string]: boolean }>({});

    // Free servers at the top, then sorted by Name#ID
    const sortedGroups = useMemo(() => {
        const groupedServers = groupBy(
            servers.filter(({ Features = 0 }) => !isSecureCoreEnabled(Features)),
            (a) => a.country
        );

        return Object.values(groupedServers).map((group) => {
            return group.sort((a, b) => {
                const freeAsc = +b.Name.includes('FREE') - +a.Name.includes('FREE');
                if (freeAsc !== 0) {
                    return freeAsc;
                }
                return serverNameAsc(a, b);
            });
        });
    }, [servers]);

    const generateSmartRoutingCountries = (logicals: EnhancedLogical[]) => {
        const filteredLogicals = logicals.filter(({ HostCountry, ExitCountry }) =>
            isSmartRouting(HostCountry, ExitCountry)
        );

        if (!filteredLogicals.length) {
            return [];
        }

        return Array.from(
            new Set(filteredLogicals.map(({ HostCountry }) => getLocalizedCountryByAbbr(HostCountry, countryOptions)))
        );
    };

    return (
        <div className="mb-6">
            {sortedGroups.map((group) => {
                const server = group[0];
                const id = server.country || '';
                const open = !!openMap[id] !== defaultOpen;
                const smartRoutingCountries = generateSmartRoutingCountries(group);
                const joinedSmartRoutingCountries = smartRoutingCountries.filter((country) => country).join(', ');
                return (
                    <Details
                        key={id}
                        open={open}
                        onToggle={() => {
                            setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
                        }}
                    >
                        <Summary>
                            <div className="ml-2 flex flex-nowrap items-center">
                                <div className={clsx([category === CATEGORY.SERVER ? 'w-1/2' : ''])}>
                                    <Country server={server} countryOptions={countryOptions} />
                                </div>
                                {category === CATEGORY.SERVER && (
                                    <>
                                        <div className="w-1/2 flex justify-space-between">
                                            <CityNumber group={group} />
                                            <div className="flex">
                                                {group.some(({ Features }) => isP2PEnabled(Features)) ? (
                                                    <P2PIcon />
                                                ) : null}
                                                {group.some(({ Features }) => isTorEnabled(Features)) ? (
                                                    <TorIcon />
                                                ) : null}
                                                <SmartRoutingIcon countries={smartRoutingCountries} />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </Summary>
                        {open && (
                            <div className="p-4">
                                {smartRoutingCountries.length ? (
                                    <Banner
                                        borderless
                                        icon={<IcGlobe />}
                                        link={
                                            <Href href="https://protonvpn.com/support/how-smart-routing-works">
                                                {c('Link').t`Learn more`}
                                            </Href>
                                        }
                                    >
                                        <span style={{ fontWeight: 'bold' }}>{c('Info').t`Smart Routing`}</span>
                                        <br />
                                        {joinedSmartRoutingCountries
                                            ? // translator: joinedSmartRoutingCountries can be a list of 2 or 3 countries such as "France, United Kingdom", but most of the time it's always only 1 country, for example "Singapour"
                                              c('Info')
                                                  .t`Connects you to your destination country through servers physically located elsewhere: ${joinedSmartRoutingCountries}.`
                                            : c('Info')
                                                  .t`Connects you to your destination country through servers physically located elsewhere.`}
                                    </Banner>
                                ) : null}
                                <ConfigsTable
                                    {...rest}
                                    category={category}
                                    servers={group}
                                    onSelect={onSelect}
                                    selecting={selecting}
                                    countryOptions={countryOptions}
                                />
                            </div>
                        )}
                    </Details>
                );
            })}
        </div>
    );
};

export default ServerConfigs;
