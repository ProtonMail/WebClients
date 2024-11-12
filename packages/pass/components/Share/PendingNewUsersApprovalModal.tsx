import { type FC, Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ModalTwoContent, ModalTwoFooter, ModalTwoHeader, useModalState } from '@proton/components/index';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { PendingNewUsersForShare } from '@proton/pass/components/Share/PendingNewUsersForShare';
import { newUserInvitePromoteIntent } from '@proton/pass/store/actions';
import { selectVaultsWithNewUserInvites } from '@proton/pass/store/selectors';
import { NewUserInviteState, type ShareId } from '@proton/pass/types';

export const PendingNewUsersApprovalModal: FC = () => {
    const dispatch = useDispatch();
    const didPrompt = useRef(false); /* Modal should prompt only once */
    const [{ open, onClose }, setModal] = useModalState({ onClose: () => (didPrompt.current = true) });

    const vaultsWithInvitesReady = useSelector(selectVaultsWithNewUserInvites);
    const [vaultsReady, setVaultsReady] = useState<ShareId[]>([]);

    const acceptAllInvites = () => {
        vaultsWithInvitesReady.forEach(({ shareId, newUserInvites }) =>
            newUserInvites?.forEach(
                ({ state, newUserInviteId }) =>
                    state === NewUserInviteState.READY &&
                    dispatch(newUserInvitePromoteIntent({ shareId, newUserInviteId }))
            )
        );

        onClose();
    };

    /* Only display the `confirm all` button if there
     * are at least 2 user invites marked as ready */
    const showConfirmAllButton = useMemo(
        () => vaultsWithInvitesReady.reduce((sum, { newUserInvitesReady }) => sum + newUserInvitesReady, 0) > 1,
        [vaultsWithInvitesReady]
    );

    useEffect(() => {
        if (!didPrompt.current) setModal(vaultsWithInvitesReady.length > 0);
    }, [vaultsWithInvitesReady]);

    return (
        open && (
            <PassModal size="medium" onClose={onClose} enableCloseWhenClickOutside open>
                <ModalTwoHeader
                    className="text-break-all mb-2"
                    closeButtonProps={{
                        pill: true,
                        className: 'absolute top-custom right-custom',
                        style: { '--right-custom': '1rem', '--top-custom': '1rem' },
                    }}
                    title={c('Title').t`Pending access confirmation`}
                    subline={c('Info').ngettext(
                        msgid`For security reasons, you need to confirm access to this shared vault`,
                        `For security reasons, you need to confirm access to these shared vaults`,
                        vaultsWithInvitesReady.length
                    )}
                />
                <ModalTwoContent className="flex flex-column items-center">
                    {vaultsWithInvitesReady.flatMap((vault, index) => (
                        <Fragment key={vault.shareId}>
                            {index > 0 && <hr className="my-3" />}
                            <PendingNewUsersForShare
                                {...vault}
                                onInvitesReady={() => setVaultsReady((shareIds) => [...shareIds, vault.shareId])}
                            />
                        </Fragment>
                    ))}
                </ModalTwoContent>

                <ModalTwoFooter className="flex flex-column items-stretch text-center">
                    {showConfirmAllButton && (
                        <Button
                            pill
                            shape="solid"
                            color="norm"
                            size="small"
                            className="w-full"
                            disabled={vaultsWithInvitesReady.some(({ shareId }) => !vaultsReady.includes(shareId))}
                            onClick={acceptAllInvites}
                        >
                            {c('Action').t`Confirm all`}
                        </Button>
                    )}
                </ModalTwoFooter>
            </PassModal>
        )
    );
};
