import { useCallback, useEffect, useMemo } from 'react';

import PropTypes from 'prop-types';

import { PLANS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';
import compare from '@proton/utils/compare';
import groupWith from '@proton/utils/groupWith';

import { Details, Summary } from '../../../components';
import { useUser, useUserVPN } from '../../../hooks';
import CityNumber from './CityNumber';
import ConfigsTable, { CATEGORY, P2PIcon, TorIcon } from './ConfigsTable';
import Country from './Country';
import ServerNumber from './ServerNumber';
import { isP2PEnabled, isSecureCoreEnabled, isTorEnabled } from './utils';

const getServerNum = (server) => Number(server.Name.replace('-TOR', '').split('#')[1]);
const getServerRegion = (server) => server.Name.split('#')[0];
const serverRegionAsc = (a, b) => compare(getServerRegion(a), getServerRegion(b));
const serverNumAsc = (a, b) => compare(getServerNum(a), getServerNum(b));
const serverNameAsc = (a, b) => serverRegionAsc(a, b) || serverNumAsc(a, b);

const ServerConfigs = ({ servers, category, select, selecting, ...rest }) => {
    const [{ hasPaidVpn }] = useUser();
    const { result, fetch: fetchUserVPN } = useUserVPN();
    const userVPN = result?.VPN || {};
    const isBasicVPN = userVPN && userVPN.PlanName === PLANS.VPNBASIC;
    const isUpgradeRequired = useCallback(
        (server) => {
            return !userVPN || (!hasPaidVpn && server.Tier > 0) || (isBasicVPN && server.Tier === 2);
        },
        [userVPN, hasPaidVpn, isBasicVPN]
    );

    useEffect(() => {
        fetchUserVPN(30_000);
    }, [hasPaidVpn]);

    // Free servers at the top, then sorted by Name#ID
    const sortedGroups = useMemo(() => {
        const groupedServers = groupWith(
            (a, b) => a.Country === b.Country,
            servers.filter(({ Features = 0 }) => !isSecureCoreEnabled(Features))
        );

        return groupedServers.map((group) => {
            const freeServers = group.filter(({ Name }) => Name.includes('FREE')).sort(serverNameAsc);
            const otherServers = group.filter(({ Name }) => !Name.includes('FREE')).sort(serverNameAsc);
            return [...freeServers, ...otherServers].map((server) => {
                return {
                    ...server,
                    isUpgradeRequired: isUpgradeRequired(server),
                };
            });
        });
    }, [servers, isUpgradeRequired]);

    return (
        <div className="mb-6">
            {sortedGroups.map((group) => {
                const server = group[0];
                return (
                    <Details key={server.Country || 'XX'} open={server.open}>
                        <Summary>
                            <div className="ml-2 flex flex-nowrap flex-align-items-center">
                                <div className={clsx([category === CATEGORY.SERVER ? 'w33' : ''])}>
                                    <Country server={server} />
                                </div>
                                {category === CATEGORY.SERVER && (
                                    <>
                                        <div className="w33">
                                            <ServerNumber group={group} />
                                        </div>
                                        <div className="w33 flex flex-justify-space-between">
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
                                onSelect={select}
                                selecting={selecting}
                            />
                        </div>
                    </Details>
                );
            })}
        </div>
    );
};

ServerConfigs.propTypes = {
    servers: PropTypes.arrayOf(
        PropTypes.shape({
            ID: PropTypes.string,
            Country: PropTypes.string,
            EntryCountry: PropTypes.string,
            ExitCountry: PropTypes.string,
            Domain: PropTypes.string,
            Features: PropTypes.number,
            Load: PropTypes.number,
            Tier: PropTypes.number,
        })
    ),
    category: PropTypes.oneOf([CATEGORY.SECURE_CORE, CATEGORY.COUNTRY, CATEGORY.SERVER, CATEGORY.FREE]),
    select: PropTypes.func,
    isSelected: PropTypes.func,
};

export default ServerConfigs;
