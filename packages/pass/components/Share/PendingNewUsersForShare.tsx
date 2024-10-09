import { type FC, useEffect, useRef } from 'react';

import { c } from 'ttag';

import { Card } from '@proton/pass/components/Layout/Card/Card';
import { PendingNewUser } from '@proton/pass/components/Share/PendingNewUser';
import { VaultIcon } from '@proton/pass/components/Vault/VaultIcon';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { getShareAccessOptions } from '@proton/pass/store/actions';
import { shareAccessOptionsRequest } from '@proton/pass/store/actions/requests';
import type { VaultShareItem } from '@proton/pass/store/reducers';
import { NewUserInviteState } from '@proton/pass/types';

type Props = VaultShareItem & { onInvitesReady: () => void };

export const PendingNewUsersForShare: FC<Props> = ({
    content,
    newUserInvites,
    newUserInvitesReady,
    shareId,
    onInvitesReady,
}) => {
    const { revalidate, loading, error } = useRequest(getShareAccessOptions, {
        initialRequestId: shareAccessOptionsRequest(shareId),
        initialLoading: true,
        onSuccess: onInvitesReady,
    });

    const didLoad = useRef(false);
    didLoad.current = !loading;
    const vaultName = content.name;

    /** Revalidate the share access options on mount. This
     * will effectively refresh the share's `newUserInvites` */
    useEffect(() => revalidate({ shareId }), []);

    return (
        <div className="flex flex-column gap-2 w-full">
            <div className="flex gap-x-3 items-center">
                <VaultIcon size={4} color={content.display.color} icon={content.display.icon} />
                <div className="text-xl text-bold text-ellipsis max-w-full">{vaultName}</div>
            </div>

            {error ? (
                <Card type="danger" className="text-sm">
                    {c('Error').t`Could not retrieve user invites for the "${vaultName}" vault`}
                </Card>
            ) : (
                <>
                    {didLoad.current
                        ? newUserInvites?.map(
                              (invite) =>
                                  invite.state === NewUserInviteState.READY && (
                                      <PendingNewUser key={invite.newUserInviteId} shareId={shareId} {...invite} />
                                  )
                          )
                        : Array.from({ length: newUserInvitesReady }, (_, idx) => (
                              <div key={`loader-${idx}`} className="pass-skeleton pass-skeleton--box my-1.5" />
                          ))}
                </>
            )}
        </div>
    );
};
