import React, { useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Cell,
    Form,
    Icon,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    Table,
    TableBody,
    TableCell,
    TableRow,
    useModalTwo,
} from '@proton/components/components';
import { MAX_IPS_ADDON } from '@proton/shared/lib/constants';
import range from '@proton/utils/range';

import { Gateway } from './Gateway';
import GatewayAddServersModal from './GatewayAddServersModal';
import { GatewayLogical } from './GatewayLogical';
import { GatewayUser } from './GatewayUser';
import { getCountryFlagAndName } from './getCountryFlagAndName';
import { getFormattedLoad, getSuffix, getTotalAdded } from './helpers';

interface Props {
    gateway: Gateway;
    language: string | readonly string[];
    countries: readonly string[];
    deletedInCountries: Record<string, number>;
    users: readonly GatewayUser[];
    ownedCount: number;
    usedCount: number;
    showDeleted?: boolean;
    showIPv4?: boolean;
    showIPv6?: boolean;
    showLoad?: boolean;
    showCancelButton?: boolean;
    singleServer?: boolean;
    isDeleted: (logical: GatewayLogical) => boolean;
    onSubmitDone: (deletedLogicalIds: readonly string[], addedQuantities: Record<string, number>) => Promise<void>;
    onResolve: () => void;
    onReject: () => void;
    onUpsell: () => void;
}

const GatewayServersModal = ({
    gateway,
    language,
    countries,
    deletedInCountries,
    users,
    ownedCount,
    usedCount,
    showDeleted = false,
    showIPv4 = true,
    showIPv6 = true,
    showLoad = true,
    showCancelButton = false,
    singleServer = false,
    isDeleted,
    onSubmitDone,
    onReject,
    onResolve,
    onUpsell,
    ...rest
}: Props) => {
    const [addServersModal, showAddServersModal] = useModalTwo(GatewayAddServersModal);
    const [deleted, setDeleted] = useState<Record<string, boolean>>({});
    const [added, setAdded] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(false);
    const remainingCount = ownedCount - usedCount;
    const previousServers = gateway.Logicals.filter((l) => !l.Servers?.length || l.Visible);
    const previousNumberOfServers = previousServers.length;
    const deletedServers = previousServers.filter((l) => deleted[l.ID]);
    const deletedServerCount = deletedServers.length;
    const addedServerCount = Object.entries(added).reduce((total, [, quantity]) => total + quantity, 0);
    const availableAddedCount = remainingCount + deletedServerCount - addedServerCount;
    const newNumberOfServers = previousNumberOfServers + addedServerCount - deletedServerCount;
    const showIP = showIPv4 || showIPv6;

    const decreaseQuantities = (quantities: Record<string, number>) => {
        const newAdded = { ...added };

        Object.entries(quantities).forEach(([country, quantity]) => {
            const newQuantity = (newAdded[country] || 0) - quantity;

            if (newQuantity) {
                newAdded[country] = newQuantity;

                return;
            }

            delete newAdded[country];
        });

        setAdded(newAdded);
    };

    const addQuantities = (quantities: Record<string, number>) => {
        const entries = Object.entries(quantities);

        if (!entries.length) {
            return;
        }

        const newAdded = { ...added };
        let deletedIds = Object.keys(deleted).filter((id) => deleted[id]);

        entries.forEach(([country, quantity]) => {
            const serversFromTrash = gateway.Logicals.filter((l) => l.ExitCountry === country && l.ID && deleted[l.ID])
                .map((l) => l.ID)
                .slice(0, quantity);
            const recoverableQuantity = serversFromTrash.length;

            if (recoverableQuantity) {
                deletedIds = deletedIds.filter((id) => serversFromTrash.indexOf(id) === -1);
            }

            const addedQuantity = quantity - recoverableQuantity;

            if (addedQuantity > 0) {
                newAdded[country] = (newAdded[country] || 0) + addedQuantity;
            }
        });

        const newDeleted: Record<string, true> = {};

        deletedIds.forEach((id) => {
            newDeleted[id] = true;
        });

        setAdded(newAdded);
        setDeleted(newDeleted);
    };

    const addServers = () =>
        showAddServersModal({
            countries,
            deletedInCountries,
            ownedCount,
            usedCount: usedCount - deletedServerCount + addedServerCount,
            users,
            language,
            singleServer,
            showCancelButton,
            onSubmitDone: addQuantities,
            onUpsell,
        });

    const handleDelete = (logical: GatewayLogical) => async () => {
        if (added[logical.ExitCountry] > 0) {
            decreaseQuantities({ [logical.ExitCountry]: 1 });

            return;
        }

        setDeleted({
            ...deleted,
            [logical.ID]: !deleted[logical.ID],
        });
    };

    const handleSubmit = async () => {
        const idsToDelete = Object.keys(deleted).filter((id) => deleted[id]);

        if (getTotalAdded(added) < 1 && idsToDelete.length < 1) {
            onReject();

            return;
        }

        try {
            setLoading(true);
            await onSubmitDone(idsToDelete, added);
            onResolve();
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <ModalTwo size="xlarge" {...rest} as={Form} onSubmit={handleSubmit} onClose={onReject}>
                <ModalTwoHeader title={c('Title').t`Edit servers`} />
                <ModalTwoContent>
                    <Table className="my-2">
                        <thead>
                            <tr>
                                <TableCell key="country" type="header">{c('Header').t`Country`}</TableCell>
                                <TableCell key="server" type="header" className="w-1/10">
                                    {c('Header').t`Server`}
                                </TableCell>
                                <TableCell key="status" type="header" className="w-1/6">
                                    {c('Header').t`Status`}
                                </TableCell>
                                {showIP && (
                                    <TableCell key="ip" type="header" className="w-1/6">
                                        {c('Header').t`IP address`}
                                    </TableCell>
                                )}
                                {showLoad && (
                                    <TableCell key="load" type="header" className="w-1/6">
                                        {c('Header').t`Server load`}
                                    </TableCell>
                                )}
                                <TableCell key="manage" type="header" className="w-1/10">
                                    &nbsp;
                                </TableCell>
                            </tr>
                        </thead>
                        <TableBody colSpan={4 + Number(showIP) + Number(showLoad)} loading={loading}>
                            {gateway.Logicals.filter((l) => l.Servers?.length && l.Visible).map((logical) => (
                                <TableRow
                                    key={'logical-' + logical.ID}
                                    className={deleted[logical.ID] ? 'opacity-50' : undefined}
                                    cells={[
                                        getCountryFlagAndName(language, logical.ExitCountry, undefined, {
                                            className: 'mb-1',
                                            key: `country-logical-${logical.ID}-${logical.ExitCountry}`,
                                        }),
                                        getSuffix(logical.Name),
                                        <span className="py-1 px-2 rounded text-uppercase bg-success">{
                                            /** translator: status of the server: people can connect to it */
                                            c('Server-Info').t`active`
                                        }</span>,
                                        ...(showIP
                                            ? [
                                                  <>
                                                      {[
                                                          showIPv4 && logical.Servers[0].ExitIPv4,
                                                          showIPv6 && logical.Servers[0].ExitIPv6,
                                                      ]
                                                          .filter(Boolean)
                                                          .map((ip) => (
                                                              <div
                                                                  key={'ip-' + ip}
                                                                  className="text-ellipsis"
                                                                  title={ip || undefined}
                                                              >
                                                                  {ip}
                                                              </div>
                                                          ))}
                                                  </>,
                                              ]
                                            : []),
                                        ...(showLoad ? [getFormattedLoad(logical.Servers)] : []),
                                        <Button icon size="small" key="delete" onClick={handleDelete(logical)}>
                                            <Icon name="trash" />
                                        </Button>,
                                    ]}
                                />
                            ))}
                            {showDeleted &&
                                gateway.Logicals.filter((l) => l.Servers?.length && !l.Visible).map((logical) => (
                                    <TableRow
                                        key={'logical-' + logical.ID}
                                        className="opacity-50"
                                        cells={[
                                            getCountryFlagAndName(language, logical.ExitCountry, undefined, {
                                                className: 'mb-1',
                                                key: 'country-logical-' + logical.ID + '-' + logical.ExitCountry,
                                            }),
                                            getSuffix(logical.Name),
                                            <span className="py-1 px-2 rounded text-uppercase bg-weak color-weak">{
                                                /** translator: status of the server: people cannot connect to it */
                                                c('Server-Info').t`inactive`
                                            }</span>,
                                            ...(showIP
                                                ? [
                                                      <>
                                                          {[logical.Servers[0].ExitIPv4, logical.Servers[0].ExitIPv6]
                                                              .filter(Boolean)
                                                              .map((ip) => (
                                                                  <div key={'ip-' + ip}>{ip}</div>
                                                              ))}
                                                      </>,
                                                  ]
                                                : []),
                                            ...(showLoad ? [getFormattedLoad(logical.Servers)] : []),
                                            '',
                                        ]}
                                    />
                                ))}
                            {gateway.Logicals.filter((l) => !l.Servers?.length).map((logical) => (
                                <TableRow
                                    key={'logical-' + logical.ID}
                                    className={deleted[logical.ID] ? 'opacity-50' : undefined}
                                    cells={[
                                        getCountryFlagAndName(language, logical.ExitCountry, undefined, {
                                            className: 'mb-1',
                                            key: 'country-logical-' + logical.ID + '-' + logical.ExitCountry,
                                        }),
                                        getSuffix(logical.Name),
                                        <span className="py-1 px-2 rounded text-uppercase bg-info">{
                                            /** translator: status of the server: people cannot yet use it */
                                            c('Server-Info').t`pending`
                                        }</span>,
                                        ...(showIP ? ['-'] : []),
                                        ...(showLoad ? ['-'] : []),
                                        <Button icon size="small" key="delete" onClick={handleDelete(logical)}>
                                            <Icon name="trash" />
                                        </Button>,
                                    ]}
                                />
                            ))}
                            {Object.keys(added).map((country) =>
                                range(0, added[country]).map((index) => (
                                    <TableRow
                                        key={'future-logical-' + country + '-' + index}
                                        cells={[
                                            getCountryFlagAndName(language, country, undefined, {
                                                className: 'mb-1',
                                                key: 'country-future-logical-' + country + '-' + index,
                                            }),
                                            '',
                                            new Cell(
                                                (
                                                    <span className="py-1 px-2 rounded text-uppercase bg-weak">{
                                                        /** translator: status of the server: will be created when user click "Save" */
                                                        c('Server-Info').t`to be created`
                                                    }</span>
                                                ),
                                                1 + Number(showIP) + Number(showLoad)
                                            ),
                                            <Button
                                                icon
                                                size="small"
                                                key="delete"
                                                onClick={() => {
                                                    decreaseQuantities({ [country]: 1 });
                                                }}
                                            >
                                                <Icon name="trash" />
                                            </Button>,
                                        ]}
                                    />
                                ))
                            )}
                        </TableBody>
                    </Table>
                    {availableAddedCount >= 1 ? (
                        <Button shape="ghost" className="color-primary" onClick={addServers}>
                            <Icon name="plus-circle-filled" className="mr-2" />
                            {c('Info').ngettext(
                                msgid`Add server (${availableAddedCount} available)`,
                                `Add server (${availableAddedCount} available)`,
                                availableAddedCount
                            )}
                        </Button>
                    ) : (
                        ownedCount < MAX_IPS_ADDON && (
                            <Button
                                shape="ghost"
                                className="color-primary"
                                onClick={() => {
                                    onUpsell();
                                    onReject();
                                }}
                            >
                                <Icon name="plus-circle-filled" className="mr-2" />
                                {c('Action').t`Get more servers`}
                            </Button>
                        )
                    )}
                </ModalTwoContent>
                <ModalTwoFooter>
                    {showCancelButton ? (
                        <Button color="weak" onClick={onReject}>
                            {c('Action').t`Cancel`}
                        </Button>
                    ) : (
                        <div />
                    )}
                    <Button color={newNumberOfServers ? 'norm' : 'danger'} type="submit" loading={loading}>
                        {newNumberOfServers ? c('Action').t`Save` : c('Action').t`Delete Gateway`}
                    </Button>
                </ModalTwoFooter>
            </ModalTwo>
            {addServersModal}
        </>
    );
};

export default GatewayServersModal;
