import { c } from 'ttag';

import type { KeyMetadata } from '@proton/account/addressKeys/getKeyMetadata';
import Badge from '@proton/components/components/badge/Badge';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import type { Key } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import type { KeyStatus } from './shared/interface';
import { KeyType } from './shared/interface';

const KeysStatus = ({
    type,
    isPrimary,
    isPrimaryFallback,
    isDecrypted,
    isCompromised,
    isObsolete,
    isAddressDisabled,
    isForwarding,
    invalidKeyError,
}: Partial<KeyStatus> & {
    type: KeyType;
    invalidKeyError: KeyMetadata<Key>['invalidKeyError'];
}) => {
    const list = [
        isPrimary &&
            !isPrimaryFallback &&
            ({
                key: 'primary',
                tooltip:
                    type === KeyType.User
                        ? c('Tooltip').t`This key is used by ${MAIL_APP_NAME} to encrypt your contact's data`
                        : c('Tooltip')
                              .t`This is the default key used by other ${MAIL_APP_NAME} users to encrypt data they send to you`,
                title: c('Key state badge').t`Primary`,
                type: 'primary',
            } as const),
        isPrimaryFallback &&
            ({
                key: 'primary-fallback',
                // no primary-fallback for user keys
                tooltip: c('Tooltip')
                    .t`This is the default key used by other ${MAIL_APP_NAME} users on older mobile apps to encrypt data they send to you`,
                title: c('Key state badge').t`Fallback`,
                type: 'success',
            } as const),
        !isDecrypted &&
            !invalidKeyError &&
            ({
                key: 'inactive',
                tooltip: c('Tooltip').t`This key is encrypted with an old password`,
                title: c('Key state badge').t`Inactive`,
                type: 'error',
            } as const),
        invalidKeyError &&
            ({
                key: 'error',
                tooltip: invalidKeyError.errorMessage,
                title: c('Key state badge').t`Invalid`,
                type: 'error',
            } as const),
        isCompromised &&
            ({
                key: 'compromised',
                tooltip: c('Tooltip')
                    .t`Signatures produced by this key are treated as invalid and this key cannot be used for encryption`,
                title: c('Key state badge').t`Compromised`,
                type: 'warning',
            } as const),
        isObsolete &&
            !isCompromised &&
            ({
                key: 'obsolete',
                tooltip: c('Tooltip').t`This key cannot be used for encryption`,
                title: c('Key state badge').t`Obsolete`,
                type: 'warning',
            } as const),
        isAddressDisabled &&
            ({
                key: 'disabled',
                tooltip: c('Tooltip').t`This address has been disabled`,
                title: c('Key state badge').t`Disabled`,
                type: 'warning',
            } as const),
        isForwarding &&
            ({
                key: 'forwarding',
                tooltip: c('Tooltip').t`This key is used for email forwarding`,
                title: c('Key state badge').t`Forwarding`,
                type: 'info',
            } as const),
    ]
        .filter(isTruthy)
        .map(({ key, tooltip, title, type }) => {
            return (
                <Badge className="m-0" key={key} tooltip={tooltip} type={type}>
                    {title}
                </Badge>
            );
        });
    return <div className="flex gap-1">{list}</div>;
};

export default KeysStatus;

export const getKeyFunction = (status: KeyStatus): { label: string; tooltip?: string } => {
    if (status.isPrimary) {
        // incl. status.isPrimaryFallback
        return {
            label: c('Key function description').t`Encryption, decryption, signing, verification`,
        };
    } else if (!status.isDecrypted) {
        return {
            label: '—',
            tooltip:
                status.isForwarding || status.isCompromised
                    ? c('Inactive key function info').t`If reactivated, the key will be used for decryption`
                    : c('Inactive key function info')
                          .t`If reactivated, the key will be used for decryption and verification`,
        };
    } else if (status.isAddressDisabled) {
        return {
            label: '—',
        };
    } else if (status.isForwarding) {
        return {
            label: c('Key function description').t`Decryption`,
        };
    } else if (status.isCompromised) {
        return {
            label: c('Key function description').t`Decryption`,
        };
    } else if (status.isObsolete) {
        return {
            label: c('Key function description').t`Decryption, verification`,
        };
    } else {
        return {
            label: c('Key function description').t`Decryption, verification`,
        };
    }
};
