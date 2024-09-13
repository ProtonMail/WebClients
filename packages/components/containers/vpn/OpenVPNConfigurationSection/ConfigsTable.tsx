import { memo } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { getVPNServerConfig } from '@proton/shared/lib/api/vpn';
import { PLANS } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import type { Logical } from '@proton/shared/lib/vpn/Logical';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import { SettingsLink, Table, TableBody, TableCell, TableRow, Tooltip } from '../../../components';
import type { CountryOptions } from '../../../helpers/countries';
import { useApi, useUser } from '../../../hooks';
import Country from './Country';
import LoadIndicator from './LoadIndicator';
import type { EnhancedLogical } from './interface';
import { normalizeName } from './normalizeName';
import { isP2PEnabled, isTorEnabled } from './utils';

export enum CATEGORY {
    SECURE_CORE = 'SecureCore',
    COUNTRY = 'Country',
    SERVER = 'Server',
    FREE = 'Free',
}

const PlusBadge = () => (
    <span className="ml-2">
        <Tooltip title="Plus">
            <div className="text-center rounded">P</div>
        </Tooltip>
    </span>
);

const ServerDown = () => (
    <span className="ml-2">
        <Tooltip title={c('Info').t`Server is currently down`}>
            <div className="flex inline-flex *:self-center">
                <Icon className="color-danger" size={5} name="exclamation-circle" />
            </div>
        </Tooltip>
    </span>
);

export const P2PIcon = () => (
    <span className="mx-2">
        <Tooltip title={c('Info').t`P2P`}>
            <Icon name="arrow-right-arrow-left" size={4.5} className="rounded bg-strong p-1" />
        </Tooltip>
    </span>
);

export const TorIcon = () => (
    <span className="mx-2">
        <Tooltip title={c('Info').t`Tor`}>
            <Icon name="brand-tor" size={4.5} className="rounded bg-strong p-1" />
        </Tooltip>
    </span>
);

interface Props {
    servers: EnhancedLogical[];
    loading?: boolean;
    protocol?: string;
    platform: string;
    category: CATEGORY;
    selecting?: boolean;
    onSelect?: (server: Logical) => void;
    countryOptions: CountryOptions;
}

// TODO: Add icons instead of text for p2p and tor when they are ready
const ConfigsTable = ({
    loading,
    servers = [],
    platform,
    protocol,
    category,
    onSelect,
    selecting,
    countryOptions,
}: Props) => {
    const api = useApi();
    const [{ hasPaidVpn }] = useUser();

    const handleClickDownload =
        ({ ID, ExitCountry, Tier, Name }: Logical) =>
        async () => {
            const buffer = await api(
                getVPNServerConfig({
                    LogicalID: category === CATEGORY.COUNTRY ? undefined : ID,
                    Platform: platform,
                    Protocol: protocol,
                    Country: ExitCountry,
                })
            );
            const blob = new Blob([buffer], { type: 'application/x-openvpn-profile' });
            const name = category === CATEGORY.COUNTRY ? ExitCountry.toLowerCase() : normalizeName({ Tier, Name });
            downloadFile(blob, `${name}.protonvpn.${protocol}.ovpn`);
        };

    return (
        <Table hasActions>
            <thead>
                <tr>
                    <TableCell
                        className={clsx(['w-auto', category === CATEGORY.SERVER ? 'md:w-1/4' : 'md:w-1/3'])}
                        type="header"
                    >
                        {[CATEGORY.SERVER, CATEGORY.FREE].includes(category)
                            ? c('TableHeader').t`Name`
                            : c('TableHeader').t`Country`}
                    </TableCell>
                    {category === CATEGORY.SERVER ? (
                        <TableCell className="w-auto md:w-1/4" type="header">{c('TableHeader').t`City`}</TableCell>
                    ) : null}
                    <TableCell
                        className={clsx(['w-auto', category === CATEGORY.SERVER ? 'md:w-1/4' : 'md:w-1/3'])}
                        type="header"
                    >{c('TableHeader').t`Status`}</TableCell>
                    <TableCell
                        className={clsx(['w-auto', category === CATEGORY.SERVER ? 'md:w-1/4' : 'md:w-1/3'])}
                        type="header"
                    >{c('TableHeader').t`Action`}</TableCell>
                </tr>
            </thead>
            <TableBody loading={loading} colSpan={4}>
                {servers.map((server) => (
                    <TableRow
                        key={server.ID}
                        cells={[
                            [CATEGORY.SERVER, CATEGORY.FREE].includes(category) ? (
                                server.Name
                            ) : (
                                <Country key="country" server={server} countryOptions={countryOptions} />
                            ),
                            category === CATEGORY.SERVER ? (
                                <div className="inline-flex *:self-center" key="city">
                                    {server.City}
                                </div>
                            ) : null,
                            <div className="inline-flex *:self-center" key="status">
                                <LoadIndicator server={server} />
                                {server.Tier === 2 && <PlusBadge />}
                                {server.Servers?.every(({ Status }) => !Status) && <ServerDown />}
                                {isP2PEnabled(server.Features) && <P2PIcon />}
                                {isTorEnabled(server.Features) && <TorIcon />}
                            </div>,
                            server.isUpgradeRequired ? (
                                <Tooltip
                                    key="download"
                                    title={
                                        server.Tier === 2
                                            ? c('Info').t`Plus or Visionary subscription required`
                                            : c('Info').t`Basic, Plus or Visionary subscription required`
                                    }
                                >
                                    <ButtonLike
                                        as={SettingsLink}
                                        color="norm"
                                        size="small"
                                        path={hasPaidVpn ? `/dashboard?plan=${PLANS.VPN2024}` : '/upgrade'}
                                    >{c('Action').t`Upgrade`}</ButtonLike>
                                </Tooltip>
                            ) : onSelect ? (
                                <Button size="small" onClick={() => onSelect(server)} loading={selecting}>
                                    {c('Action').t`Create`}
                                </Button>
                            ) : (
                                <Button size="small" onClick={handleClickDownload(server)}>
                                    {c('Action').t`Download`}
                                </Button>
                            ),
                        ].filter(isTruthy)}
                    />
                ))}
            </TableBody>
        </Table>
    );
};

export default memo(ConfigsTable);
