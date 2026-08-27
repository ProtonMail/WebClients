import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { Member } from '@proton/shared/lib/interfaces';

import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import MemberRowList from './MemberRowList';

interface Props {
    administrators: Member[];
    onTryAnotherWay: () => void;
    onDone: () => void;
}

/**
 * Shown when other administrators still have access to the organization key. They can restore this administrator's
 * privileges without a reset, which is far less disruptive, so it is offered before resetting the key.
 */
const ContactAdministratorsStep = ({ administrators, onTryAnotherWay, onDone }: Props) => {
    return (
        <>
            <ModalTwoHeader title={c('organization key reset').t`Can you reach out to other administrators?`} />
            <ModalTwoContent>
                <p className="mt-0">
                    {c('organization key reset')
                        .t`Get in touch with your other administrators, to see if they can help. They will be able to restore your privileges after using a data recovery method.`}
                </p>
                <div className="border border-weak rounded px-3">
                    <MemberRowList members={administrators} />
                </div>
                <p>
                    {c('organization key reset')
                        .t`Once your privileges have been restored, you'll be able to create non-private users and access their accounts.`}
                </p>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onTryAnotherWay}>{c('organization key reset').t`Try another way`}</Button>
                <Button color="norm" onClick={onDone}>{c('Action').t`Done`}</Button>
            </ModalTwoFooter>
        </>
    );
};

export default ContactAdministratorsStep;
