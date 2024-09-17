import { c } from 'ttag';

import { Badge } from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import isTruthy from '@proton/utils/isTruthy';

import type { KeyStatus } from './shared/interface';
import { KeyType } from './shared/interface';

const KeysStatus = ({
    type,
    isPrimary,
    isDecrypted,
    isCompromised,
    isObsolete,
    isAddressDisabled,
    isForwarding,
}: Partial<KeyStatus> & { type: KeyType }) => {
    const list = [
        isPrimary &&
            ({
                tooltip:
                    type === KeyType.User
                        ? c('Tooltip').t`This key is used by ${MAIL_APP_NAME} to encrypt your contact's data`
                        : c('Tooltip').t`${MAIL_APP_NAME} users will use this key by default for sending`,
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
        isForwarding &&
            ({
                tooltip: c('Tooltip').t`This key is used for email forwarding`,
                title: c('Key state badge').t`Forwarding`,
                type: 'info',
            } as const),
    ]
        .filter(isTruthy)
        .map(({ tooltip, title, type }) => {
            return (
                <Badge className="m-0" key={title} tooltip={tooltip} type={type}>
                    {title}
                </Badge>
            );
        });
    return <div className="flex gap-1">{list}</div>;
};

export default KeysStatus;
