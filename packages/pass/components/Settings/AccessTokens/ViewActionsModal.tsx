import type { CSSProperties, FC } from 'react';
import { useEffect, useState } from 'react';
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
import type { MaybeNull } from '@proton/pass/types';
import { EventType2 as PassEventType } from '@proton/pass/types/api/pass';
import { epochToDateTime } from '@proton/pass/utils/time/format';
import clsx from '@proton/utils/clsx';

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
const formatActionLabel = (action: PassEventType): string | null => {
    switch (action) {
        case PassEventType.ITEM_READ:
            return c('Info').t`Read item`;
        case PassEventType.ITEM_CREATE:
            return c('Info').t`Created item`;
        case PassEventType.ITEM_UPDATE:
            return c('Info').t`Updated item`;
        case PassEventType.ITEM_TRASH:
            return c('Info').t`Moved item to trash`;
        case PassEventType.ITEM_UNTRASH:
            return c('Info').t`Restored item from trash`;
        case PassEventType.ITEM_SOFT_DELETE:
            return c('Info').t`Deleted item`;
        case PassEventType.PERSONAL_ACCESS_TOKEN_ACCESS_GRANTED:
            return c('Info').t`Vault access granted`;
        default:
            return null;
    }
};

export const ViewActionsModal: FC<Props> = ({ token, onClose }) => {
    const tokenId = token.PersonalAccessTokenID;
    const { records } = useSelector(selectAccessTokenActions(tokenId));
    const [nextSince, setNextSince] = useState<MaybeNull<string>>(null);

    const getActions = useRequest(getAccessTokenActions, {
        loading: true,
        onSuccess: ({ nextSince }) => setNextSince(nextSince),
    });

    const initialLoading = getActions.loading && nextSince === null;
    const loadMore = () => nextSince && getActions.dispatch({ tokenId, since: nextSince });

    useEffect(() => getActions.revalidate({ tokenId }), [tokenId]);

    return (
        <PassModal open onClose={onClose} onReset={onClose} size="xlarge" enableCloseWhenClickOutside>
            <ModalTwoHeader title={c('pass_2026: Title').t`Activity for "${token.Name}"`} />
            <ModalTwoContent className="min-h-custom flex flex-column" style={{ '--min-h-custom': '10rem' }}>
                <p className="color-weak mt-0 mb-3">
                    {c('pass_2026: Info').t`Every action this agent token has performed, newest first.`}
                </p>

                {(() => {
                    if (initialLoading || records.length === 0) {
                        return (
                            <div className="flex flex-1 items-center justify-center text-sm">
                                {records.length === 0 ? (
                                    <span className="color-weak">
                                        {c('pass_2026: Info').t`No activity recorded yet.`}
                                    </span>
                                ) : (
                                    <CircleLoader size="medium" />
                                )}
                            </div>
                        );
                    }

                    return (
                        <div className="rounded border border-weak">
                            {records.map(({ Action, ActionTime, PatMonitorRecordID, decodedPayload }, i) => {
                                const last = i === records.length - 1;
                                const label = formatActionLabel(Action);
                                const payload = decodedPayload?.kind === 'agent-action' ? decodedPayload : null;
                                const isDecodeError = decodedPayload?.kind === 'decode-error';

                                return (
                                    <div
                                        key={PatMonitorRecordID}
                                        className={clsx('px-4 py-3', !last && 'border-bottom border-weak')}
                                    >
                                        <div className="flex flex-nowrap items-baseline justify-space-between gap-3 mb-2">
                                            <strong className="text-ellipsis">
                                                {label ?? c('pass_2026: Activity').t`Activity`}
                                            </strong>
                                            <span className="text-sm color-weak shrink-0">
                                                {epochToDateTime(ActionTime)}
                                            </span>
                                        </div>
                                        {payload && (
                                            <dl className="m-0 grid gap-x-3 gap-y-1 text-sm" style={fieldGrid}>
                                                {payload.itemName && (
                                                    <>
                                                        <dt className="color-weak m-0">
                                                            {c('pass_2026: Activity').t`Item`}
                                                        </dt>
                                                        <dd className="m-0 text-ellipsis" title={payload.itemName}>
                                                            {payload.itemName}
                                                        </dd>
                                                    </>
                                                )}
                                                {payload.vaultName && (
                                                    <>
                                                        <dt className="color-weak m-0">
                                                            {c('pass_2026: Activity').t`Vault`}
                                                        </dt>
                                                        <dd className="m-0 text-ellipsis" title={payload.vaultName}>
                                                            {payload.vaultName}
                                                        </dd>
                                                    </>
                                                )}
                                                {payload.folderName && (
                                                    <>
                                                        <dt className="color-weak m-0">
                                                            {c('pass_2026: Activity').t`Folder`}
                                                        </dt>
                                                        <dd className="m-0 text-ellipsis" title={payload.folderName}>
                                                            {payload.folderName}
                                                        </dd>
                                                    </>
                                                )}
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
                                        {isDecodeError && (
                                            <div className="text-sm color-weak text-italic">
                                                {c('pass_2026: Activity').t`Activity details could not be loaded.`}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })()}

                {nextSince && (
                    <div className="flex justify-center mt-3">
                        <Button shape="outline" onClick={loadMore} loading={getActions.loading}>
                            {c('pass_2026: Action').t`Load more`}
                        </Button>
                    </div>
                )}
            </ModalTwoContent>
            <ModalTwoFooter />
        </PassModal>
    );
};
