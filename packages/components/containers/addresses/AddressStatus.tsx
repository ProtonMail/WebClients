import { c } from 'ttag';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { Badge } from '../../components';
import { AddressStatuses } from './helper';

const AddressStatus = ({ isDefault, isActive, isDisabled, isOrphan, isMissingKeys }: AddressStatuses) => {
    const list = [
        isDefault &&
            ({
                text: c('Address status').t`Default`,
                type: 'primary',
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
    ]
        .filter(isTruthy)
        .map(({ text, type }) => {
            return (
                <Badge key={text} type={type}>
                    {text}
                </Badge>
            );
        });

    return <>{list}</>;
};
export default AddressStatus;
