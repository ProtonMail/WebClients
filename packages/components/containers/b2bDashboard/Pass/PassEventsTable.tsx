import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { AppLink, SortingTableHeader, Table, TableBody, TableRow, Time, Tooltip } from '@proton/components/components';
import { getShareID } from '@proton/shared/lib/api/b2blogs';
import { APPS, SORT_DIRECTION } from '@proton/shared/lib/constants';

import type { PassEvent } from '..';
import { useApi } from '../../..';
import { getDesciptionText, getDescriptionTextWithLink, getEventNameText } from './helpers';

interface Props {
    events: PassEvent[];
    loading: boolean;
    handleEventClick: (event: string) => void;
    handleTimeClick: (time: string) => void;
    handleEmailOrIpClick: (keyword: string) => void;
    handleToggleSort: (direction: SORT_DIRECTION) => void;
}

interface DescriptionProps {
    shareId: string | null;
    itemId: string | null;
    event: string;
    hasInvalidShareId: boolean;
}

interface SortConfig {
    key: keyof PassEvent;
    direction: SORT_DIRECTION;
}

const Description = ({ shareId, itemId, event, hasInvalidShareId }: DescriptionProps) => {
    if (hasInvalidShareId) {
        return (
            <Tooltip title={c('Info').t`Vault either deleted or requires access permissions`}>
                <span className="">{getDesciptionText(event)}</span>
            </Tooltip>
        );
    }
    if (itemId) {
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

const PassEventsTable = ({
    events,
    loading,
    handleEventClick,
    handleTimeClick,
    handleEmailOrIpClick,
    handleToggleSort,
}: Props) => {
    const api = useApi();
    const [shareIds, setShareIds] = useState<{ [key: string]: string | null }>({});
    const [invalidShareIds, setInvalidShareIds] = useState<Set<string>>(new Set());
    const cache = useRef<{ [key: string]: string | null }>({});

    const vaultIds = [...new Set(events.map((event) => event.eventData?.vaultId))];

    useEffect(() => {
        const fetchShareIds = async () => {
            const idsMap: { [key: string]: string | null } = {};
            const newInvalidIds = new Set(invalidShareIds);

            await Promise.all(
                vaultIds.map(async (vaultId) => {
                    if (cache.current[vaultId]) {
                        idsMap[vaultId] = cache.current[vaultId];
                        newInvalidIds.delete(vaultId);
                    } else {
                        try {
                            const { Share } = await api(getShareID(vaultId));
                            idsMap[vaultId] = Share.ShareID;
                            cache.current[vaultId] = Share.ShareID;
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
        direction: SORT_DIRECTION.ASC,
    });

    const toggleSort = () => {
        setSortConfig({
            ...sortConfig,
            direction: sortConfig.direction === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC,
        });
        handleToggleSort(sortConfig.direction);
    };

    return (
        <Table responsive="cards">
            <SortingTableHeader
                config={sortConfig}
                onToggleSort={toggleSort}
                cells={[
                    { key: 'time', content: c('TableHeader').t`Time`, sorting: true },
                    { content: c('Title').t`User` },
                    { content: c('Title').t`Event` },
                    { content: c('Title').t`Description` },
                    { content: c('Title').t`IP` },
                ]}
            />
            <TableBody colSpan={5} loading={loading}>
                {events.map(({ time, user, event, ip, eventData }, index) => {
                    const { name, email } = user;
                    const { vaultId, itemId } = eventData;
                    const key = index;

                    const unixTime = new Date(time).getTime() / 1000;
                    const shareId = shareIds[vaultId];
                    const hasInvalidShareId = vaultId ? invalidShareIds.has(vaultId) : false;

                    return (
                        <TableRow
                            key={key}
                            cells={[
                                <Button
                                    onClick={() => handleTimeClick(time)}
                                    color="weak"
                                    size="small"
                                    shape="ghost"
                                    className="px-1"
                                >
                                    <Time format="PPp">{unixTime}</Time>
                                </Button>,
                                <div className="flex flex-column">
                                    <span>{name}</span>
                                    <Button
                                        onClick={() => handleEmailOrIpClick(email)}
                                        color="weak"
                                        size="small"
                                        shape="ghost"
                                        className="px-1"
                                    >
                                        <span className="color-weak">{email}</span>
                                    </Button>
                                </div>,
                                <Button
                                    onClick={() => handleEventClick(event)}
                                    color="weak"
                                    shape="solid"
                                    size="small"
                                    className=""
                                >
                                    {getEventNameText(event)}
                                </Button>,
                                <Description
                                    shareId={shareId}
                                    itemId={itemId}
                                    event={event}
                                    hasInvalidShareId={hasInvalidShareId}
                                />,
                                <Button
                                    onClick={() => handleEmailOrIpClick(ip)}
                                    color="weak"
                                    size="small"
                                    shape="ghost"
                                    className="px-1"
                                >
                                    <span>{ip}</span>
                                </Button>,
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default PassEventsTable;
