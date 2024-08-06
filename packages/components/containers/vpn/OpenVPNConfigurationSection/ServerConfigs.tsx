import { useMemo } from 'react';

import type { Logical } from '@proton/shared/lib/vpn/Logical';
import clsx from '@proton/utils/clsx';
import compare from '@proton/utils/compare';
import groupWith from '@proton/utils/groupWith';

import { Details, Summary } from '../../../components';
import type { CountryOptions } from '../../../helpers/countries';
import CityNumber from './CityNumber';
import ConfigsTable, { CATEGORY, P2PIcon, TorIcon } from './ConfigsTable';
import Country from './Country';
import ServerNumber from './ServerNumber';
import type { EnhancedLogical } from './interface';
import { isP2PEnabled, isSecureCoreEnabled, isTorEnabled } from './utils';

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
}

const ServerConfigs = ({ servers, category, onSelect, selecting, countryOptions, ...rest }: Props) => {
    // Free servers at the top, then sorted by Name#ID
    const sortedGroups = useMemo(() => {
        const groupedServers = groupWith(
            (a, b) => a.country === b.country,
            servers.filter(({ Features = 0 }) => !isSecureCoreEnabled(Features))
        );

        return groupedServers.map((group) => {
            const sortedList = group.sort(serverNameAsc);

            const [freeServers, otherServers] = sortedList.reduce<[EnhancedLogical[], EnhancedLogical[]]>(
                (acc, logical) => {
                    if (logical.Name.includes('FREE')) {
                        acc[0].push(logical);
                    } else {
                        acc[1].push(logical);
                    }
                    return acc;
                },
                [[], []]
            );

            return [...freeServers, ...otherServers].map((server) => {
                return server;
            });
        });
    }, [servers]);

    return (
        <div className="mb-6">
            {sortedGroups.map((group) => {
                const server = group[0];
                return (
                    <Details key={server.country || 'XX'} open={server.open}>
                        <Summary>
                            <div className="ml-2 flex flex-nowrap items-center">
                                <div className={clsx([category === CATEGORY.SERVER ? 'w-1/3' : ''])}>
                                    <Country server={server} countryOptions={countryOptions} />
                                </div>
                                {category === CATEGORY.SERVER && (
                                    <>
                                        <div className="w-1/3">
                                            <ServerNumber group={group} />
                                        </div>
                                        <div className="w-1/3 flex justify-space-between">
                                            <CityNumber group={group} />
                                            <div className={clsx(['flex'])}>
                                                {group.some(({ Features }) => isP2PEnabled(Features)) ? (
                                                    <P2PIcon />
                                                ) : null}
                                                {group.some(({ Features }) => isTorEnabled(Features)) ? (
                                                    <TorIcon />
                                                ) : null}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </Summary>
                        <div className="p-4">
                            <ConfigsTable
                                {...rest}
                                category={category}
                                servers={group}
                                onSelect={onSelect}
                                selecting={selecting}
                                countryOptions={countryOptions}
                            />
                        </div>
                    </Details>
                );
            })}
        </div>
    );
};

export default ServerConfigs;
