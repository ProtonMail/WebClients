import { useState } from 'react';

import { c, msgid } from 'ttag';

import userExclamation from '@proton/account/delegatedAccess/emergencyContact/outgoing/user-exclamation.svg';
import { Button } from '@proton/atoms/Button/Button';
import { Card } from '@proton/atoms/Card/Card';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';

import Checkbox from '../../../components/input/Checkbox';
import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import getBoldFormattedText from '../../../helpers/getBoldFormattedText';
import { getEstimatedResetMinutes } from './helper';
import type { NonPrivateMembersProps } from './interface';

interface Props extends NonPrivateMembersProps {
    onReset: () => void;
    onClose: () => void;
}

/**
 * Last step before the reset runs. The converted users get an unprivatization email out of the blue, so the
 * administrator has to confirm they warned them first.
 */
const NotifyUsersStep = ({ nonPrivateMembers, onShowUsers, onReset, onClose }: Props) => {
    const [notified, setNotified] = useState(false);
    const n = nonPrivateMembers.length;
    const minutes = getEstimatedResetMinutes(n);

    return (
        <>
            <ModalTwoHeader title={c('organization key reset').t`Ready to reset your organization key?`} />
            <ModalTwoContent>
                <p className="mt-0">
                    {getBoldFormattedText(
                        c('organization key reset').ngettext(
                            msgid`This should take less than ${minutes} minute. **Keep this browser tab open and your device active** until it completes.`,
                            `This should take less than ${minutes} minutes. **Keep this browser tab open and your device active** until it completes.`,
                            minutes
                        )
                    )}
                </p>
                <Card rounded className="flex flex-nowrap items-start gap-3">
                    <img src={userExclamation} alt="" className="shrink-0" />
                    <div>
                        {getBoldFormattedText(
                            c('organization key reset')
                                .t`Before continuing, **let your users know they'll receive an admin access request by email**, so they're not caught off guard.`
                        )}{' '}
                        <InlineLinkButton onClick={onShowUsers}>
                            {c('organization key reset').ngettext(msgid`See ${n} user`, `See ${n} users`, n)}
                        </InlineLinkButton>
                    </div>
                </Card>
                <p>
                    {c('organization key reset')
                        .t`To become non-private again, they must accept the request to enable admin access, from their account settings. You don't need to wait for this step.`}
                </p>
                <Checkbox checked={notified} onChange={() => setNotified(!notified)} className="items-start">
                    <span className="ml-1">
                        {c('organization key reset')
                            .t`I've notified my users that they'll receive an unprivatization request.`}
                    </span>
                </Checkbox>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="danger" disabled={!notified} onClick={onReset}>
                    {c('organization key reset').t`Reset key`}
                </Button>
            </ModalTwoFooter>
        </>
    );
};

export default NotifyUsersStep;
