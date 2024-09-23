import { c } from 'ttag';

import Badge from '@proton/components/components/badge/Badge';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import type { AddressStatuses } from './helper';

const AddressStatus = ({
    isDefault,
    isActive,
    isDisabled,
    isOrphan,
    isMissingKeys,
    isExternal,
    isNotEncrypted,
    isSignatureNotExpected,
}: Partial<AddressStatuses>) => {
    const list = [
        isDefault &&
            ({
                text: c('Address status').t`Default`,
                type: 'primary',
            } as const),
        isExternal &&
            ({
                text: c('Address status').t`External`,
                type: 'info',
            } as const),
        isActive &&
            ({
                text: c('Address status').t`Active`,
                type: 'success',
            } as const),
        isDisabled &&
            ({
                text: c('Address status').t`Disabled`,
                type: 'light',
            } as const),
        isOrphan &&
            ({
                text: c('Address status').t`Orphan`,
                type: 'origin',
            } as const),
        isMissingKeys &&
            ({
                text: c('Address status').t`Inactive`,
                type: 'light',
                tooltip: c('Tooltip').t`This can be caused by a password reset or the user not logging in yet.`,
            } as const),
        isNotEncrypted &&
            ({
                // translator: E2EE stands for end-to-end encryption. If possible, keep the abbreviation as the UI will be best with a short translated string.
                text: c('Address status').t`No E2EE mail`,
                type: 'error',
            } as const),
        isSignatureNotExpected &&
            ({
                text: c('Address status').t`Allow unsigned mail`,
                type: 'error',
            } as const),
    ]
        .filter(isTruthy)
        .map(({ text, type, tooltip }) => {
            const addresssBadge = (
                <Badge key={text} type={type} className={clsx('mr-1 mb-1', tooltip && 'cursor-default')}>
                    {text}
                </Badge>
            );

            if (tooltip) {
                return (
                    <Tooltip title={tooltip} key={text}>
                        <span>{addresssBadge}</span>
                    </Tooltip>
                );
            }

            return addresssBadge;
        });

    return <>{list}</>;
};
export default AddressStatus;
