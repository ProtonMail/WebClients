import { type ReactNode, useEffect, useRef, useState } from 'react';

import { getUnixTime, parseISO } from 'date-fns';
import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { UserIdentity } from '@proton/atoms/UserIdentity/UserIdentity';
import { getShareID } from '@proton/shared/lib/api/b2bevents';
import { APPS, SORT_DIRECTION } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import AppLink from '../../../components/link/AppLink';
import { SortingTableHeader } from '../../../components/table/SortingTableHeader';
import Table from '../../../components/table/Table';
import TableBody from '../../../components/table/TableBody';
import TableRow from '../../../components/table/TableRow';
import Time from '../../../components/time/Time';
import { NoEventsInfo } from '../NoEventsInfo';
import type { PassEvent, PassEventData } from './interface';

interface Props {
    events: PassEvent[];
    loading: boolean;
    onEventClick: (event: string) => void;
    onTimeClick: (time: string) => void;
    onEmailOrIpClick: (keyword: string) => void;
    onToggleSort: (direction: SORT_DIRECTION) => void;
}

interface DetailsProps {
    eventType: string;
    eventData: PassEventData;
    shareId?: string;
    onEmailClick: (email: string) => void;
}

interface TargetIdProps {
    /** Full ID, shown as the tooltip since the label is truncated. */
    id: string;
    label: string;
    /** Pass app path, when the target is reachable. */
    to?: string;
}

interface SortConfig {
    key: keyof PassEvent;
    direction: SORT_DIRECTION;
}

type IdsMap = Record<string, string | undefined>;

/**
 * IDs are long base64 strings, so only a prefix is shown. Enough to match a row against the
 * `EventData.VaultID` / `EventData.ItemID` columns of the CSV export.
 */
const ID_PREVIEW_LENGTH = 8;

/** `EventData` is an untyped cast, so a field promised as a string can arrive as anything. */
const asText = (value: unknown): string | undefined =>
    typeof value === 'string' && value.length > 0 ? value : undefined;

/** The item is gone after these, so its ID is shown but not linked. */
const DELETED_ITEM_EVENT_TYPES = new Set(['ItemDeleted']);

/** The ID always renders. Linking it needs a share, which an admin only has on vaults shared with them. */
const TargetId = ({ id, label, to }: TargetIdProps) => {
    const preview = id.length > ID_PREVIEW_LENGTH ? `${id.slice(0, ID_PREVIEW_LENGTH)}…` : id;
    const text = `${label} ${preview}`;

    return to ? (
        <AppLink toApp={APPS.PROTONPASS} title={id} to={to}>
            {text}
        </AppLink>
    ) : (
        <span title={id} className="text-ellipsis max-w-full">
            {text}
        </span>
    );
};

/**
 * Extra context for event where the name itself doesn't convey
 */
const Details = ({ eventType, eventData, shareId, onEmailClick }: DetailsProps) => {
    const vaultId = asText(eventData.vaultId);
    const itemId = asText(eventData.itemId);
    const email = asText(eventData.shareEmail) ?? asText(eventData.invitedEmail) ?? asText(eventData.email);
    const parts: ReactNode[] = [];

    if (vaultId) {
        parts.push(
            <TargetId
                key="vault"
                id={vaultId}
                label={c('Label').t`Vault`}
                to={shareId ? `/share/${shareId}` : undefined}
            />
        );
    }

    if (itemId) {
        const isReachable = Boolean(shareId) && !DELETED_ITEM_EVENT_TYPES.has(eventType);

        parts.push(
            <TargetId
                key="item"
                id={itemId}
                label={c('Label').t`Item`}
                to={isReachable ? `/share/${shareId}/item/${itemId}` : undefined}
            />
        );
    }

    if (email) {
        parts.push(
            <button
                key="email"
                type="button"
                title={email}
                className="text-left text-ellipsis max-w-full"
                onClick={() => onEmailClick(email)}
            >
                {email}
            </button>
        );
    }

    if (!parts.length) {
        return <span className="color-weak">-</span>;
    }

    return <div className="flex flex-column">{parts}</div>;
};

const PassEventsTable = ({ events, loading, onEventClick, onTimeClick, onEmailOrIpClick, onToggleSort }: Props) => {
    const api = useApi();
    const [shareIds, setShareIds] = useState<IdsMap>({});
    const cache = useRef<IdsMap>({});

    const vaultIds = [...new Set(events.map((event) => event.eventData?.vaultId).filter(isTruthy))];

    useEffect(() => {
        const fetchShareIds = async () => {
            const idsMap: IdsMap = {};

            await Promise.all(
                /** Having no share is normal, not an error: the API answers `200` with a null `Share`. */
                vaultIds.map(async (vaultId) => {
                    if (!(vaultId in cache.current)) {
                        try {
                            const { Share } = await api(getShareID(vaultId));
                            cache.current[vaultId] = asText(Share?.ShareID);
                        } catch (e) {
                            cache.current[vaultId] = undefined;
                        }
                    }

                    idsMap[vaultId] = cache.current[vaultId];
                })
            );
            setShareIds((prev) => ({ ...prev, ...idsMap }));
        };

        if (vaultIds.length > 0) {
            void fetchShareIds();
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

    // Only claim there are no events once we actually know. While the first request is in flight
    // `events` is still empty, and returning early here would show the empty state instead of the
    // loading skeleton that `TableBody` renders.
    if (events.length === 0 && !loading) {
        return <NoEventsInfo />;
    }

    return (
        <Table responsive="cards">
            <SortingTableHeader
                config={sortConfig}
                onToggleSort={toggleSort}
                cells={[
                    { content: c('Title').t`User`, className: 'w-1/4' },
                    { key: 'time', content: c('TableHeader').t`Event`, sorting: true, className: 'w-1/4' },
                    { content: c('Title').t`Details`, className: 'w-1/4' },
                    { content: c('Title').t`IP`, className: 'w-1/4' },
                ]}
            />
            <TableBody colSpan={5} loading={loading}>
                {events.map(({ time, user, eventType, eventTypeName, ip, eventData }, index) => {
                    const { name, email } = user;
                    const { vaultId } = eventData ?? {};
                    const key = index;

                    const shareId = vaultId ? shareIds[vaultId] : undefined;
                    const formattedTime = getUnixTime(parseISO(time));

                    return (
                        <TableRow
                            key={key}
                            cells={[
                                <UserIdentity
                                    className="my-2"
                                    name={name}
                                    email={email}
                                    onClick={() => onEmailOrIpClick(email)}
                                />,
                                <div className="flex flex-column cursor-pointer">
                                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
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
                                <Details
                                    eventType={eventType}
                                    eventData={eventData ?? {}}
                                    shareId={shareId}
                                    onEmailClick={onEmailOrIpClick}
                                />,
                                // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
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
