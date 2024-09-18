import React, { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button, Href } from '@proton/atoms';
import { PromotionBanner } from '@proton/components';
import { PLANS, SERVER_FEATURES, SORT_DIRECTION } from '@proton/shared/lib/constants';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';
import { getVPNDedicatedIPs } from '@proton/shared/lib/helpers/subscription';
import type { Organization } from '@proton/shared/lib/interfaces';
import gatewaySvg from '@proton/styles/assets/img/illustrations/gateway.svg';
import gatewaysEmptyStateAdminsSvg from '@proton/styles/assets/img/illustrations/gateways-empty-state-admins.svg';
import gatewaysEmptyStateUsersSvg from '@proton/styles/assets/img/illustrations/gateways-empty-state-users.svg';

import { Loader, Table, TableBody, TableCell, useModalTwoStatic } from '../../../components';
import SettingsSectionWide from '../../../containers/account/SettingsSectionWide';
import { EmptyViewContainer } from '../../../containers/app';
import { SUBSCRIPTION_STEPS, useSubscriptionModal } from '../../../containers/payments';
import { getCountryOptions } from '../../../helpers/countries';
import { useApi, useNotifications, useSortedList, useSubscription, useUser, useUserSettings } from '../../../hooks';
import type { Gateway } from './Gateway';
import type { GatewayLogical } from './GatewayLogical';
import GatewayModal from './GatewayModal';
import type { GatewayModel } from './GatewayModel';
import GatewayRenameModal from './GatewayRenameModal';
import GatewayRow from './GatewayRow';
import GatewayServersModal from './GatewayServersModal';
import GatewayUsersModal from './GatewayUsersModal';
import { addIpInVPNGateway, createVPNGateway, deleteVPNGateway, renameVPNGateway, updateVPNGatewayUsers } from './api';
import { useGateways } from './useGateways';

interface Props {
    organization?: Organization;
    showCancelButton?: boolean;
}

const getFeaturesAndUserIds = (data: Partial<GatewayModel>): [number, readonly string[] | null] => {
    const features = data.Features || 0;

    return [features, features & SERVER_FEATURES.DOUBLE_RESTRICTION ? data.UserIds || [] : null];
};

const GatewaysSection = ({ organization, showCancelButton = true }: Props) => {
    const api = useApi();
    const [createModal, showCreateModal] = useModalTwoStatic(GatewayModal);
    const [renameModal, showRenameModal] = useModalTwoStatic(GatewayRenameModal);
    const [usersModal, showUsersModal] = useModalTwoStatic(GatewayUsersModal);
    const [serversModal, showServersModal] = useModalTwoStatic(GatewayServersModal);
    const [user] = useUser();
    const { createNotification } = useNotifications();
    const [userSettings] = useUserSettings();
    const [subscription] = useSubscription();
    const [deletedLogicals, setDeletedLogicals] = useState<Record<string, boolean>>({});
    const [deletingLogicals, setDeletingLogicals] = useState<readonly string[]>([]);
    const [createdGateways, setCreatedGateways] = useState<Gateway[]>([]);
    const [updatedLogicals, setUpdatedLogicals] = useState<Record<string, GatewayLogical>>({});
    const {
        config: {
            Table: { IPv4, IPv6, Load, Deleted },
            ServerTable: serverTableConfig,
            Provisioning: { TranslatedDuration: provisioningDuration },
        },
        users,
        countries,
        gateways,
        refresh,
    } = useGateways();
    const refreshList = async () => {
        setCreatedGateways([]);
        setUpdatedLogicals({});
        await refresh();
    };
    const allGateways = useMemo<readonly Gateway[]>(() => {
        const ids: Record<string, true> = {};

        return [...createdGateways, ...(gateways || [])]
            .map((gateway) => ({
                ...gateway,
                Logicals: gateway.Logicals.filter((l) => !deletedLogicals[l.ID]).map((l) => updatedLogicals[l.ID] || l),
            }))
            .filter((gateway) => {
                if (ids[gateway.Name]) {
                    return false;
                }

                if (gateway.Logicals.length) {
                    ids[gateway.Name] = true;

                    return true;
                }

                return false;
            });
    }, [createdGateways, gateways, updatedLogicals, deletedLogicals]);
    const { sortedList } = useSortedList(allGateways as Gateway[], { key: 'Name', direction: SORT_DIRECTION.ASC });
    const [openSubscriptionModal] = useSubscriptionModal();

    if (!organization || !user || !subscription || !gateways || !countries) {
        return <Loader />;
    }

    const createGateway = async (apiRequest: any): Promise<Gateway> => {
        const createdGateway = (await api<{ Gateway: Gateway }>(apiRequest))?.Gateway;

        const newDeletedLogicals = { ...deletedLogicals };
        const newUpdatedLogicals = { ...updatedLogicals };
        let touched = false;

        createdGateway.Logicals?.forEach((logical) => {
            if ((newUpdatedLogicals[logical.ID] || newDeletedLogicals[logical.ID]) && logical.Visible) {
                touched = true;

                newUpdatedLogicals[logical.ID] = logical;
                delete newDeletedLogicals[logical.ID];
            }
        });

        if (touched) {
            setDeletedLogicals(newDeletedLogicals);
            setUpdatedLogicals(newUpdatedLogicals);
        }

        return createdGateway;
    };

    const getCustomizeSubscriptionOpener = (source: 'dashboard' | 'upsells') => () =>
        openSubscriptionModal({
            metrics: {
                source,
            },
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            plan: PLANS.VPN_BUSINESS,
        });

    const isAdmin = user.isAdmin && !user.isSubUser;

    const countryOptions = getCountryOptions(userSettings);

    if (organization.PlanName !== PLANS.VPN_BUSINESS) {
        const boldDedicatedServers = (
            <b key="bold-dedicated-servers">{
                // translator: Full sentence "With a Business or Enterprise plan, you can purchase dedicated servers for your organization, and set up Gateways to control which users can access them"
                c('Info').t`dedicated servers`
            }</b>
        );
        const boldGateways = (
            <b key="bold-gateways">{
                // translator: Full sentence "With a Business or Enterprise plan, you can purchase dedicated servers for your organization, and set up Gateways to control which users can access them"
                c('Info').t`Gateways`
            }</b>
        );

        return (
            <SettingsSectionWide>
                <PromotionBanner
                    rounded
                    mode="banner"
                    contentCentered={false}
                    icon={<img src={gatewaySvg} alt="" width={40} height={40} />}
                    description={
                        <div>
                            <b>{c('Info').t`Enhance your network security`}</b>
                            <div>
                                {
                                    // translator: Full sentence "With a Business or Enterprise plan, you can purchase dedicated servers for your organization, and set up Gateways to control which users can access them"
                                    c('Info')
                                        .jt`With a Business or Enterprise plan, you can purchase ${boldDedicatedServers} for your organization, and set up ${boldGateways} to control which users can access them.`
                                }{' '}
                                <Href
                                    href="https://protonvpn.com/support/manage-vpn-servers-organization"
                                    title={c('Info').t`Lean more about gateways`}
                                >{c('Link').t`Learn more`}</Href>
                            </div>
                        </div>
                    }
                    cta={
                        isAdmin && (
                            <Button
                                color="norm"
                                fullWidth
                                onClick={getCustomizeSubscriptionOpener('upsells')}
                                title={c('Title').t`Setup dedicated servers by upgrading to Business`}
                            >
                                {c('Action').t`Upgrade to Business`}
                            </Button>
                        )
                    }
                />
            </SettingsSectionWide>
        );
    }

    const isDeleted = (logical: GatewayLogical): boolean => !logical.Visible && logical.Servers?.length > 0;

    const ipAddresses = getVPNDedicatedIPs(subscription);
    const deletedInCountries: Record<string, number> = {};
    const ipCount = allGateways.reduce((total, gateway) => {
        return (
            total +
            gateway.Logicals.reduce((sum, logical) => {
                if (isDeleted(logical)) {
                    deletedInCountries[gateway.ExitCountry] = (deletedInCountries[gateway.ExitCountry] || 0) + 1;

                    return sum;
                }

                return sum + Math.max(1, logical.Servers?.length || 0);
            }, 0)
        );
    }, 0);
    const canAdd = ipAddresses > ipCount;

    const createServersSequentially = async (
        data: GatewayModel,
        initialGateway?: Gateway,
        key = 'gateway-creation',
        getNotificationMessage?: (serverNumber: number, total: number) => string
    ): Promise<Gateway | undefined> => {
        const quantities = data.Quantities;

        if (!quantities) {
            return;
        }

        const countries = Object.keys(quantities);
        const total = countries.reduce((total, country) => total + (quantities[country] || 0), 0);
        let gatewayHost: Gateway | undefined = initialGateway;
        let serverNumber = 0;

        for (let i = 0; i < countries.length; i++) {
            const country = countries[i];

            for (let j = 0; j < quantities[country]; j++) {
                ++serverNumber;

                createNotification({
                    key,
                    text: getNotificationMessage
                        ? getNotificationMessage(serverNumber, total)
                        : /*
                        translator: "Creating gateway servers" refers to the whole operation, so pluralization uses ${total}, not ${serverNumber}, "Creating gateway servers: 1 / 3" is plural in English because we are creating a gateway of 3 servers
                        translator: This message appears when starting to creating a gateway that will contain ${total} server in the end (total is always an integer and at least 2, so for any language with "One" form < 2, don't care much about singular)
                        */ c('Info').ngettext(
                              msgid`Creating gateway server: ${serverNumber} / ${total}`,
                              `Creating gateway servers: ${serverNumber} / ${total}`,
                              total
                          ),
                    type: 'info',
                });

                if (!gatewayHost) {
                    const [features, usersIds] = getFeaturesAndUserIds(data);

                    gatewayHost = await createGateway(
                        createVPNGateway({
                            Name: data.Name,
                            Country: country,
                            Features: features,
                            UserIds: usersIds,
                        })
                    );

                    continue;
                }

                try {
                    gatewayHost = await createGateway(
                        addIpInVPNGateway({
                            Name: gatewayHost.Name,
                            Country: country,
                        })
                    );
                } catch (error) {
                    createNotification({
                        key,
                        text: getNonEmptyErrorMessage(error),
                        type: 'warning',
                    });

                    return gatewayHost;
                }
            }
        }

        return gatewayHost;
    };

    const buildGateway = async (data: GatewayModel): Promise<Gateway | undefined> => {
        if (data.Quantities) {
            return createServersSequentially(data);
        }

        const [features, usersIds] = getFeaturesAndUserIds(data);

        return createGateway(
            createVPNGateway({
                Name: data.Name,
                Country: data.Country,
                Features: features,
                UserIds: usersIds,
            })
        );
    };

    const addGateway = () =>
        showCreateModal({
            countryOptions,
            showCancelButton,
            countries,
            deletedInCountries,
            ownedCount: ipAddresses,
            usedCount: ipCount,
            users,
            onSubmitDone: async (data: GatewayModel) => {
                const gateway = await buildGateway(data);

                if (!gateway) {
                    createNotification({
                        text: c('Error').t`Impossible to create the gateway`,
                        type: 'error',
                    });

                    return;
                }

                setCreatedGateways([...createdGateways, gateway]);
            },
            onUpsell: getCustomizeSubscriptionOpener('dashboard'),
        });

    const editGatewayServers = (gateway: Gateway) => () =>
        showServersModal({
            countryOptions,
            showCancelButton,
            gateway,
            countries,
            deletedInCountries,
            users,
            ownedCount: ipAddresses,
            usedCount: ipCount,
            showDeleted: serverTableConfig.Deleted,
            showIPv4: serverTableConfig.IPv4,
            showIPv6: serverTableConfig.IPv6,
            showLoad: serverTableConfig.Load,
            isDeleted,
            onSubmitDone: async (deletedLogicalIds: readonly string[], addedQuantities: Record<string, number>) => {
                const deletedServerCount = deletedLogicalIds.length;
                const addedServerCount = Object.entries(addedQuantities).reduce(
                    (total, [, quantity]) => total + quantity,
                    0
                );

                if (deletedServerCount && addedServerCount) {
                    createNotification({
                        key: 'gateway-servers-editions',
                        text: c('Info').ngettext(
                            msgid`Deleting ${deletedServerCount} gateway server`,
                            `Deleting ${deletedServerCount} gateway servers`,
                            deletedServerCount
                        ),
                        type: 'info',
                    });
                }

                if (deletedServerCount) {
                    await api(deleteVPNGateway(deletedLogicalIds));
                }

                if (deletedServerCount && addedServerCount) {
                    createNotification({
                        key: 'gateway-servers-editions',
                        text: c('Info').ngettext(
                            msgid`Adding ${addedServerCount} gateway server`,
                            `Adding ${addedServerCount} gateway servers`,
                            addedServerCount
                        ),
                        type: 'info',
                    });
                }

                if (addedServerCount) {
                    await createServersSequentially(
                        {
                            Name: gateway.Name,
                            Features: gateway.Logicals[0]?.Features,
                            UserIds: gateway.Logicals[0]?.Users,
                            Quantities: addedQuantities,
                        },
                        gateway,
                        'gateway-servers-editions',
                        (serverNumber: number, total: number) =>
                            /*
                            translator: "Creating gateway servers" refers to the whole operation, so pluralization uses ${total}, not ${serverNumber}, "Creating gateway servers: 1 / 3" is plural in English because we are creating a gateway of 3 servers
                            translator: This message appears when starting to creating a gateway that will contain ${total} server in the end (total is always an integer and at least 2, so for any language with "One" form < 2, don't care much about singular)
                            */ c('Info').ngettext(
                                msgid`Adding gateway server: ${serverNumber} / ${total}`,
                                `Adding gateway servers: ${serverNumber} / ${total}`,
                                total
                            )
                    );
                }

                await refreshList();
            },
            onUpsell: getCustomizeSubscriptionOpener('dashboard'),
        });

    const editGatewayUsers = (gateway: Gateway, logical: GatewayLogical) => () =>
        showUsersModal({
            showCancelButton,
            model: {
                features: logical.Features,
                userIds: logical.Users,
            },
            users,
            onSubmitDone: async (data: GatewayModel) => {
                const [features, usersIds] = getFeaturesAndUserIds(data);

                const update = await api<{ Gateway: Gateway }>(updateVPNGatewayUsers(gateway.Name, features, usersIds));

                if (!update?.Gateway) {
                    createNotification({
                        text: c('Error').t`Impossible to edit the gateway`,
                        type: 'error',
                    });

                    return;
                }

                await refreshList();
            },
        });

    const renameGateway = (id: string, currentName: string) => () => {
        if (deletingLogicals.indexOf(id) !== -1) {
            return;
        }

        showRenameModal({
            showCancelButton,
            currentName,
            onSubmitDone: async ({ Name: newName }: { Name: string }) => {
                const gateway = await api<{ Gateway: Gateway }>(renameVPNGateway(currentName, newName));

                if (!gateway?.Gateway) {
                    createNotification({
                        text: c('Error').t`Impossible to rename the gateway`,
                        type: 'error',
                    });

                    return;
                }

                await refreshList();
            },
        });
    };

    const deleteGateway = (gateway: Gateway) => async () => {
        const ids = gateway.Logicals.map(({ ID }) => ID);

        if (deletingLogicals.some((id) => ids.indexOf(id) !== -1)) {
            return;
        }

        setDeletingLogicals([...deletingLogicals, ...ids]);

        try {
            const { Logicals: logicals } = await api<{ Logicals: GatewayLogical[] }>(deleteVPNGateway(ids));
            const update = { ...updatedLogicals };
            const kept: Record<string, boolean> = {};

            logicals.forEach((logical) => {
                kept[logical.ID] = true;
                update[logical.ID] = logical;
            });

            setUpdatedLogicals(update);

            if (ids.length !== Object.keys(kept).length) {
                const removed: Record<string, boolean> = { ...deletedLogicals };

                ids.forEach((id) => {
                    if (!kept[id]) {
                        removed[id] = true;
                    }
                });

                setDeletedLogicals(removed);
            }
        } finally {
            setDeletingLogicals(deletingLogicals.filter((deletingId) => ids.indexOf(deletingId) === -1));
        }
    };

    return (
        <>
            {isAdmin && (
                <>
                    {createModal}
                    {renameModal}
                    {serversModal}
                    {usersModal}
                    <div className="mb-4 flex items-center gap-2">
                        <span className="color-weak">
                            {c('Info').ngettext(
                                msgid`You are currently using ${ipCount} of your ${ipAddresses} available dedicated server.`,
                                `You are currently using ${ipCount} of your ${ipAddresses} available dedicated servers.`,
                                ipAddresses
                            )}
                        </span>
                        <Button
                            size="small"
                            color="norm"
                            shape={canAdd ? 'outline' : 'solid'}
                            onClick={getCustomizeSubscriptionOpener('dashboard')}
                            title={c('Title').t`Customize the number of IP addresses in your plan`}
                        >
                            {c('Action').t`Get more servers`}
                        </Button>
                    </div>
                </>
            )}

            {sortedList.length ? (
                <>
                    {isAdmin && (
                        <div className="mb-4">
                            <Button
                                color="norm"
                                disabled={!canAdd}
                                onClick={addGateway}
                                title={c('Title').t`Create a new Gateway`}
                            >
                                {c('Action').t`Create Gateway`}
                            </Button>
                        </div>
                    )}

                    <Table className="my-2">
                        <thead>
                            <tr>
                                <TableCell key="name" type="header">{c('Header').t`Name`}</TableCell>
                                <TableCell key="status" type="header" className="w-1/10">
                                    {c('Header').t`Status`}
                                </TableCell>
                                <TableCell key="servers" type="header">{c('Header').t`Servers`}</TableCell>
                                {isAdmin && (
                                    <>
                                        <TableCell key="members" type="header">{c('Header').t`Members`}</TableCell>
                                        <TableCell
                                            key="manage"
                                            type="header"
                                            className="w-custom"
                                            style={{ '--w-custom': '12rem' }}
                                        >
                                            &nbsp;
                                        </TableCell>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <TableBody colSpan={3 + (isAdmin ? 2 : 0)}>
                            {sortedList.map((gateway) => (
                                <GatewayRow
                                    countryOptions={countryOptions}
                                    key={`gateway-${gateway.Name}`}
                                    isAdmin={isAdmin}
                                    showDeleted={Deleted}
                                    showIPv4={IPv4}
                                    showIPv6={IPv6}
                                    showLoad={Load}
                                    gateway={gateway}
                                    isDeleted={isDeleted}
                                    users={users ?? []}
                                    provisioningDuration={provisioningDuration}
                                    renameGateway={renameGateway}
                                    editGatewayServers={editGatewayServers}
                                    editGatewayUsers={editGatewayUsers}
                                    deleteGateway={deleteGateway}
                                    deletingLogicals={deletingLogicals}
                                    deletedLogicals={deletedLogicals}
                                />
                            ))}
                        </TableBody>
                    </Table>
                </>
            ) : (
                <EmptyViewContainer
                    key="no-gateways-container"
                    imageProps={{
                        src: isAdmin ? gatewaysEmptyStateAdminsSvg : gatewaysEmptyStateUsersSvg,
                        title: c('Info').t`No gateways`,
                        key: 'no-gateways-image',
                    }}
                >
                    <h3 className="text-bold">
                        {isAdmin ? c('Info').t`Create your first Gateway` : c('Info').t`No Gateways yet`}
                    </h3>
                    <p className="color-weak">
                        {isAdmin
                            ? c('Info')
                                  .t`Organize your dedicated servers into Gateways and decide which members can access them.`
                            : c('Info').t`Ask your organisation admin to setup Gateways.`}
                    </p>

                    {isAdmin && (
                        <div>
                            <Button
                                color="norm"
                                disabled={!canAdd}
                                onClick={addGateway}
                                title={c('Title').t`Create a new gateway`}
                            >
                                {c('Action').t`Create Gateway`}
                            </Button>
                        </div>
                    )}
                </EmptyViewContainer>
            )}
        </>
    );
};

export default GatewaysSection;
