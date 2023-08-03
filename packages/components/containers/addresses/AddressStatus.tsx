import { c } from 'ttag';

import isTruthy from '@proton/utils/isTruthy';

import { Badge } from '../../components';
import { AddressStatuses } from './helper';

const AddressStatus = ({
    isDefault,
    isActive,
    isDisabled,
    isOrphan,
    isMissingKeys,
    isExternal,
    isNotEncrypted,
    isSignatureNotExpected,
}: AddressStatuses) => {
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
                text: c('Address status').t`Missing keys`,
                type: 'warning',
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
        .map(({ text, type }) => {
            return (
                <Badge key={text} type={type} className="mr-1 mb-1">
                    {text}
                </Badge>
            );
        });

    return <>{list}</>;
};
export default AddressStatus;
