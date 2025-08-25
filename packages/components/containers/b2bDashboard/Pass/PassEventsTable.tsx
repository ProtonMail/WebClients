import { useEffect, useRef, useState } from 'react';

import { getUnixTime, parseISO } from 'date-fns';
import { c } from 'ttag';

import { Avatar, Tooltip } from '@proton/atoms';
import AppLink from '@proton/components/components/link/AppLink';
import { SortingTableHeader } from '@proton/components/components/table/SortingTableHeader';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableRow from '@proton/components/components/table/TableRow';
import Time from '@proton/components/components/time/Time';
import useApi from '@proton/components/hooks/useApi';
import { getShareID } from '@proton/shared/lib/api/b2bevents';
import { APPS, SORT_DIRECTION } from '@proton/shared/lib/constants';
import { getInitials } from '@proton/shared/lib/helpers/string';
import isTruthy from '@proton/utils/isTruthy';

import { getDesciptionText, getDescriptionTextWithLink } from './helpers';
import type { PassEvent } from './interface';

interface Props {
    events: PassEvent[];
    loading: boolean;
    onEventClick: (event: string) => void;
    onTimeClick: (time: string) => void;
    onEmailOrIpClick: (keyword: string) => void;
    onToggleSort: (direction: SORT_DIRECTION) => void;
}

interface DescriptionProps {
    event: string;
    hasInvalidShareId: boolean;
    shareId?: string;
    itemId?: string;
}

interface SortConfig {
    key: keyof PassEvent;
    direction: SORT_DIRECTION;
}

type IdsMap = Record<string, string | undefined>;

const Description = ({ shareId, itemId, event, hasInvalidShareId }: DescriptionProps) => {
    if (hasInvalidShareId) {
        return (
            <Tooltip title={c('Info').t`Vault either deleted or requires access permissions`}>
                <span className="">{getDesciptionText(event)}</span>
            </Tooltip>
        );
    }
    if (shareId && itemId) {
        const vaultLink = (
            <AppLink key="link" toApp={APPS.PROTONPASS} to={`/share/${shareId}/item/${itemId}`}>{c('Link')
                .t`Vault`}</AppLink>
        );
        return <span>{getDescriptionTextWithLink(event, vaultLink)}</span>;
    }
    if (shareId) {
        const vaultLink = (
            <AppLink key="link" toApp={APPS.PROTONPASS} to={`/share/${shareId}`}>{c('Link').t`Vault`}</AppLink>
        );
        return <span>{getDescriptionTextWithLink(event, vaultLink)}</span>;
    }
    return (
        <div className="flex flex-column">
            <span className="">{getDesciptionText(event)}</span>
        </div>
    );
};

const PassEventsTable = ({ events, loading, onEventClick, onTimeClick, onEmailOrIpClick, onToggleSort }: Props) => {
    const api = useApi();
    const [shareIds, setShareIds] = useState<IdsMap>({});
    const [invalidShareIds, setInvalidShareIds] = useState<Set<string>>(new Set());
    const cache = useRef<IdsMap>({});

    const vaultIds = [...new Set(events.map((event) => event.eventData?.vaultId).filter(isTruthy))];

    useEffect(() => {
        const fetchShareIds = async () => {
            const idsMap: IdsMap = {};
            const newInvalidIds = new Set(invalidShareIds);

            await Promise.all(
                vaultIds.map(async (vaultId) => {
                    if (cache.current[vaultId]) {
                        idsMap[vaultId] = cache.current[vaultId];
                        newInvalidIds.delete(vaultId);
                    } else {
                        try {
                            const { Share } = await api(getShareID(vaultId));
                            const shareId: string | undefined = Share.ShareID;
                            idsMap[vaultId] = shareId;
                            cache.current[vaultId] = shareId;
                            newInvalidIds.delete(vaultId);
                        } catch (e) {
                            newInvalidIds.add(vaultId);
                        }
                    }
                })
            );
            setShareIds((prev) => ({ ...prev, ...idsMap }));
            setInvalidShareIds(newInvalidIds);
        };

        if (vaultIds.length > 0) {
            fetchShareIds();
        }
    }, [events, api]);

    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: 'time',
        direction: SORT_DIRECTION.DESC,
    });

    const toggleSort = () => {
        setSortConfig({
            ...sortConfig,
            direction: sortConfig.direction === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC,
        });
        onToggleSort(sortConfig.direction);
    };

    return (
        <Table responsive="cards">
            <SortingTableHeader
                config={sortConfig}
                onToggleSort={toggleSort}
                cells={[
                    { content: c('Title').t`User`, className: 'w-1/4' },
                    { key: 'time', content: c('TableHeader').t`Event`, sorting: true, className: 'w-1/4' },
                    { content: c('Title').t`Description`, className: 'w-1/4' },
                    { content: c('Title').t`IP`, className: 'w-1/4' },
                ]}
            />
            <TableBody colSpan={5} loading={loading}>
                {events.map(({ time, user, eventType, eventTypeName, ip, eventData }, index) => {
                    const { name, email } = user;
                    const { vaultId, itemId } = eventData;
                    const key = index;

                    const shareId = vaultId ? shareIds[vaultId] : undefined;
                    const hasInvalidShareId = vaultId ? invalidShareIds.has(vaultId) : false;
                    const initials = name ? getInitials(name) : email.charAt(0);
                    const formattedTime = getUnixTime(parseISO(time));

                    return (
                        <TableRow
                            key={key}
                            cells={[
                                <div className="flex flex-row items-center my-2">
                                    <Avatar className="mr-2" color="weak">
                                        {initials}
                                    </Avatar>
                                    <div
                                        className="flex flex-column cursor-pointer w-2/3"
                                        onClick={() => onEmailOrIpClick(email)}
                                    >
                                        <span title={name} className="text-ellipsis max-w-full">
                                            {name}
                                        </span>
                                        <span title={email} className="color-weak text-ellipsis max-w-full">
                                            {email}
                                        </span>
                                    </div>
                                </div>,
                                <div className="flex flex-column cursor-pointer">
                                    <div
                                        className="flex flex-row mb-1 text-semibold"
                                        onClick={() => onEventClick(eventType)}
                                    >
                                        {eventTypeName}
                                    </div>
                                    <Time format="PPp" className="color-weak" onClick={() => onTimeClick(time)}>
                                        {formattedTime}
                                    </Time>
                                </div>,
                                <Description
                                    shareId={shareId}
                                    itemId={itemId}
                                    event={eventType}
                                    hasInvalidShareId={hasInvalidShareId}
                                />,
                                <span onClick={() => onEmailOrIpClick(ip)} className="cursor-pointer">
                                    {ip}
                                </span>,
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default PassEventsTable;
