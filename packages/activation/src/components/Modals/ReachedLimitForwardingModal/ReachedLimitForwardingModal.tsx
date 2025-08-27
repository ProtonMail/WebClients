import { c, msgid } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { MAX_SYNC_PAID_USER } from '@proton/activation/src/constants';
import { Button } from '@proton/atoms';
import { Prompt } from '@proton/components';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { isAdmin } from '@proton/shared/lib/user/helpers';
import { useFlag } from '@proton/unleash';

const getModalText = (hasAccessToBYOE: boolean) => {
    if (hasAccessToBYOE) {
        /*translator: full sentence is "You've connected 3 Gmail addresses. To add another, first disable one of your connected accounts."*/
        return c('loc_nightly: BYOE').ngettext(
            msgid`You've connected ${MAX_SYNC_PAID_USER} Gmail address. To add another, first disable one of your connected accounts.`,
            `You've connected ${MAX_SYNC_PAID_USER} Gmail addresses. To add another, first disable one of your connected accounts.`,
            MAX_SYNC_PAID_USER
        );
    }

    /*translator: full sentence is "You've enabled forwarding on 3 Gmail addresses. To add another, first disable one of your them."*/
    return c('Info').ngettext(
        msgid`You've enabled forwarding on ${MAX_SYNC_PAID_USER} Gmail address. To add another, first disable one of them.`,
        `You've enabled forwarding on ${MAX_SYNC_PAID_USER} Gmail addresses. To add another, first disable one of them.`,
        MAX_SYNC_PAID_USER
    );
};

interface Props extends ModalStateProps {}

const ReachedLimitForwardingModal = ({ ...rest }: Props) => {
    const [user] = useUser();
    // Only admins can access to BYOE for now, this will change later
    const hasAccessToBYOE = useFlag('InboxBringYourOwnEmail') && isAdmin(user);

    return (
        <Prompt
            title={c('Title').t`Limit reached`}
            buttons={[<Button onClick={rest.onClose}>{c('Action').t`Got it`}</Button>]}
            {...rest}
        >
            <p>{getModalText(hasAccessToBYOE)}</p>
        </Prompt>
    );
};

export default ReachedLimitForwardingModal;
