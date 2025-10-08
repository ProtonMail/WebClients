import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import WarningIcon from './WarningIcon';

interface Props {
    className?: string;
}

// Unlike ContactKeys, PersonalKeys can always encrypt and sign, and never trigger email mismatching warnings, since they are reformatted on import to match the user's address.
// However, if they were created or imported a while ago, they might be considered too weak security-wise.
const PersonalKeyWarningIcon = ({ className }: Props) => {
    const warning = c('Weak personal key warning')
        .t`This key no longer meets our security standards. We suggest you mark it as obsolete and generate a new key.`;

    return (
        <Href href={getKnowledgeBaseUrl('/openpgp-keys-security')} className={className}>
            <WarningIcon warning={warning} />
        </Href>
    );
};

export default PersonalKeyWarningIcon;
