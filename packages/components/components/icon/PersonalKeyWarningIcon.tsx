import { c } from 'ttag';
import WarningIcon from './WarningIcon';
import Href from '../link/Href';

interface Props {
    isWeak: boolean;
    className?: string;
}

const PersonalKeyWarningIcon = ({ isWeak, className }: Props) => {
    // Unlike ContactKeys, PersonalKeys can always encrypt and sign, and never trigger email mismatching warnings, since they are reformatted on import to match the user's address.
    // However, if they were created or imported a while ago, they might be considered too weak security-wise.
    if (!isWeak) {
        return null;
    }

    const warning = c('Weak personal key warning')
        .t`This key no longer meets our security standards. We suggest you mark it as obsolete and generate a new key.`;

    return (
        <Href url="https://protonmail.com/support/knowledge-base/openpgp-keys-security/" className={className}>
            <WarningIcon warning={warning} />
        </Href>
    );
};

export default PersonalKeyWarningIcon;
