import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Href } from '@proton/atoms/Href/Href';
import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import ModalTwoContent from '../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../components/modalTwo/ModalHeader';
import getBoldFormattedText from '../../../helpers/getBoldFormattedText';
import { getResetOrganizationKeyDataText } from './helper';
import type { NonPrivateMembersProps } from './interface';

interface Props extends NonPrivateMembersProps {
    onContinue: () => void;
    onClose: () => void;
}

/**
 * First step of the non-private variant: explains that the members have to be converted, and what the automated
 * process is going to do on their behalf.
 */
const ConvertUsersStep = ({ nonPrivateMembers, onShowUsers, onContinue, onClose }: Props) => {
    const n = nonPrivateMembers.length;

    return (
        <>
            <ModalTwoHeader title={c('organization key reset').t`Reset organization key?`} />
            <ModalTwoContent>
                <p className="mt-0">
                    {getBoldFormattedText(
                        c('organization key reset').ngettext(
                            msgid`To reset the organization key and restore your administrator privileges, **${n} non-private user must be temporarily converted to private.**`,
                            `To reset the organization key and restore your administrator privileges, **${n} non-private users must be temporarily converted to private.**`,
                            n
                        )
                    )}{' '}
                    <InlineLinkButton onClick={onShowUsers}>
                        {c('organization key reset').t`See users`}
                    </InlineLinkButton>
                </p>
                <p>{c('organization key reset').t`This process is automated:`}</p>
                <ol className="mt-0 flex flex-column gap-2">
                    <li>{c('organization key reset').t`The non-private users are converted to private`}</li>
                    <li>{c('organization key reset').t`The organization key is reset`}</li>
                    <li>
                        {c('organization key reset')
                            .t`An unprivatization request is sent by email to the converted users`}
                    </li>
                </ol>
                <p>
                    {c('organization key reset')
                        .t`Afterward, every converted user must accept the request to become non-private again, from their account settings.`}{' '}
                    <Href href={getKnowledgeBaseUrl('/restore-administrator')}>{c('Link').t`Learn more`}</Href>
                </p>
                <p className="mb-0">{getBoldFormattedText(getResetOrganizationKeyDataText())}</p>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" onClick={onContinue}>{c('Action').t`Continue`}</Button>
            </ModalTwoFooter>
        </>
    );
};

export default ConvertUsersStep;
