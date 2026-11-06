import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { selectOrgTOTPDisabled } from '../../../../store/selectors/organization';
import type { ExtraFieldType } from '../../../../types/protobuf';
import { getExtraFieldOptions } from './ExtraField.utils';

export const useExtraFieldOptions = () => {
    const orgTOTPDisabled = useSelector(selectOrgTOTPDisabled);

    return useCallback(
        (onClick?: (type: ExtraFieldType) => void) =>
            getExtraFieldOptions(onClick).filter(({ value }) => !(orgTOTPDisabled && value === 'totp')),
        [orgTOTPDisabled]
    );
};
