import type { CSSProperties, FC } from 'react';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { useRequest } from '@proton/pass/hooks/useRequest';
import type { PersonalAccessToken } from '@proton/pass/lib/access-token/access-token.types';
import { getAccessTokenActions } from '@proton/pass/store/actions';
import { selectAccessTokenActions } from '@proton/pass/store/selectors';
import { epochToDateTime } from '@proton/pass/utils/time/format';

type Props = {
    token: PersonalAccessToken;
    onClose: () => void;
};

/** Two-column grid: label / value, with the label column auto-sized to its
 * content so all values line up across rows in a single record. */
const fieldGrid: CSSProperties = { gridTemplateColumns: 'max-content 1fr' };

/** Lightweight numeric -> label mapping. The server's `EventType` enum
 * has dozens of values; only a handful are agent-relevant. Returns null
 * for anything unmapped so the UI can omit the label rather than show a
 * raw "Action #N". */
const formatActionLabel = (action: number): string | null => {
    switch (action) {
        case 132 /* ITEM_READ */:
            return c('pass_2026: Activity').t`Read item`;
        case 160 /* PERSONAL_ACCESS_TOKEN_ACCESS_GRANTED */:
            return c('pass_2026: Activity').t`Vault access granted`;
        default:
            return null;
    }
};

export const ViewActionsModal: FC<Props> = ({ token, onClose }) => {
    const tokenId = token.PersonalAccessTokenID;
    const { records, nextSince } = useSelector(selectAccessTokenActions(tokenId));
    const fetchActions = useRequest(getAccessTokenActions, { loading: true });

    /* Fetch the first page on open. The reducer replaces (not appends)
     * when the intent has no `since`, so re-opening shows fresh data. */
    useEffect(() => {
        fetchActions.dispatch({ tokenId });
    }, [tokenId]);

    const loadMore = () => {
        if (nextSince) fetchActions.dispatch({ tokenId, since: nextSince });
    };

    const isFirstLoad = fetchActions.loading && records.length === 0;

    return (
        <PassModal open onClose={onClose} onReset={onClose} size="large">
            <ModalTwoHeader title={c('pass_2026: Title').t`Activity for "${token.Name}"`} />
            <ModalTwoContent>
                <p className="color-weak mt-0 mb-3">
                    {c('pass_2026: Info').t`Every action this agent token has performed, newest first.`}
                </p>

                {(() => {
                    if (isFirstLoad) {
                        return (
                            <div className="flex justify-center py-6">
                                <CircleLoader size="medium" />
                            </div>
                        );
                    }
                    if (records.length === 0) {
                        return (
                            <div className="text-sm color-weak text-center py-6">
                                {c('pass_2026: Info').t`No activity recorded yet.`}
                            </div>
                        );
                    }
                    return (
                        <div
                            className="flex flex-column gap-1 rounded border border-weak overflow-auto"
                            style={{ maxHeight: '24rem' }}
                        >
                            {records.map((r) => {
                                const label = formatActionLabel(r.Action);
                                const payload =
                                    r.decodedPayload?.kind === 'agent-access-item' ? r.decodedPayload : null;
                                return (
                                    <div
                                        key={r.PatMonitorRecordID}
                                        className="flex flex-column gap-2 px-4 py-3 border-bottom border-weak last:border-bottom-0"
                                    >
                                        <div className="flex items-baseline justify-space-between gap-3">
                                            <span className="text-bold">
                                                {label ?? c('pass_2026: Activity').t`Activity`}
                                            </span>
                                            <span className="text-sm color-weak shrink-0">
                                                {epochToDateTime(r.ActionTime)}
                                            </span>
                                        </div>
                                        {payload && (
                                            <dl className="m-0 grid gap-x-3 gap-y-1 text-sm" style={fieldGrid}>
                                                <dt className="color-weak m-0">{c('pass_2026: Activity').t`Item`}</dt>
                                                <dd className="m-0 text-ellipsis" title={payload.itemName}>
                                                    {payload.itemName}
                                                </dd>
                                                <dt className="color-weak m-0">{c('pass_2026: Activity').t`Vault`}</dt>
                                                <dd className="m-0 text-ellipsis" title={payload.vaultName}>
                                                    {payload.vaultName}
                                                </dd>
                                                {payload.reason && (
                                                    <>
                                                        <dt className="color-weak m-0">
                                                            {c('pass_2026: Activity').t`Reason`}
                                                        </dt>
                                                        <dd className="m-0 text-ellipsis" title={payload.reason}>
                                                            {payload.reason}
                                                        </dd>
                                                    </>
                                                )}
                                            </dl>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}

                {nextSince && (
                    <div className="flex justify-center mt-3">
                        <Button shape="outline" onClick={loadMore} loading={fetchActions.loading}>
                            {c('pass_2026: Action').t`Load more`}
                        </Button>
                    </div>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
            </ModalTwoFooter>
        </PassModal>
    );
};
