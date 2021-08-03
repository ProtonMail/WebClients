import { c } from 'ttag';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { Badge } from '../../components';
import { KeyStatus } from './shared/interface';

const KeysStatus = ({ isPrimary, isDecrypted, isCompromised, isObsolete, isAddressDisabled }: Partial<KeyStatus>) => {
    const list = [
        isPrimary &&
            ({
                tooltip: c('Tooltip').t`ProtonMail users will use this key by default for sending`,
                title: c('Key state badge').t`Primary`,
                type: 'primary',
            } as const),
        isDecrypted
            ? ({
                  tooltip: c('Tooltip').t`You have locally decrypted this key`,
                  title: c('Key state badge').t`Active`,
                  type: 'success',
              } as const)
            : ({
                  tooltip: c('Tooltip').t`This key is encrypted with an old password`,
                  title: c('Key state badge').t`Inactive`,
                  type: 'error',
              } as const),
        isCompromised &&
            ({
                tooltip: c('Tooltip')
                    .t`Signatures produced by this key are treated as invalid and this key cannot be used for encryption`,
                title: c('Key state badge').t`Compromised`,
                type: 'warning',
            } as const),
        isObsolete &&
            !isCompromised &&
            ({
                tooltip: c('Tooltip').t`This key cannot be used for encryption`,
                title: c('Key state badge').t`Obsolete`,
                type: 'warning',
            } as const),
        isAddressDisabled &&
            ({
                tooltip: c('Tooltip').t`This address has been disabled`,
                title: c('Key state badge').t`Disabled`,
                type: 'warning',
            } as const),
    ]
        .filter(isTruthy)
        .map(({ tooltip, title, type }) => {
            return (
                <Badge key={title} tooltip={tooltip} type={type}>
                    {title}
                </Badge>
            );
        });
    return <>{list}</>;
};

export default KeysStatus;
