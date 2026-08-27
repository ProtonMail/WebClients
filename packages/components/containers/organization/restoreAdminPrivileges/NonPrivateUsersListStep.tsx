import { c, msgid } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { IcArrowLeft } from '@proton/icons/icons/IcArrowLeft';
import { IcSquares } from '@proton/icons/icons/IcSquares';
import { textToClipboard } from '@proton/shared/lib/helpers/browser';
import type { Member } from '@proton/shared/lib/interfaces';

import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import MemberRowList from './MemberRowList';
import { getCopiedEmailListNotification, getMemberEmailList } from './helper';

interface Props {
    nonPrivateMembers: Member[];
    onBack: () => void;
}

/**
 * The full list of members that will be converted, so the administrator can warn them up front. Reachable from both
 * of the confirmation steps, which is why it takes an explicit `onBack`.
 */
const NonPrivateUsersListStep = ({ nonPrivateMembers, onBack }: Props) => {
    const { createNotification } = useNotifications();
    const n = nonPrivateMembers.length;

    return (
        <>
            <ModalTwoHeader title={c('organization key reset').t`Non-private users`} />
            <ModalTwoContent>
                <p className="mt-0">
                    {c('organization key reset')
                        .t`To reset the organization key, the users will be converted to private, and will receive an email invitation to become non-private again.`}
                </p>
                <h3 className="text-rg text-bold mb-2">
                    {c('organization key reset').ngettext(msgid`User (${n})`, `Users (${n})`, n)}
                </h3>
                <MemberRowList members={nonPrivateMembers} withCopy />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onBack}>
                    <IcArrowLeft className="mr-2 shrink-0 align-text-bottom" />
                    {c('Action').t`Back`}
                </Button>
                <Button
                    color="norm"
                    onClick={(event) => {
                        textToClipboard(getMemberEmailList(nonPrivateMembers), event.currentTarget);
                        createNotification({ text: getCopiedEmailListNotification() });
                    }}
                >
                    <IcSquares className="mr-2 shrink-0 align-text-bottom" />
                    {c('organization key reset').t`Copy email list`}
                </Button>
            </ModalTwoFooter>
        </>
    );
};

export default NonPrivateUsersListStep;
