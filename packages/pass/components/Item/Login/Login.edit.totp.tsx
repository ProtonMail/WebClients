import type { FC } from 'react';
import { useSelector } from 'react-redux';

import type { FormikContextType } from 'formik';
import { c } from 'ttag';

import { IcLock } from '@proton/icons/icons/IcLock';

import { UpsellRef } from '../../../constants';
import { selectTOTPLimits } from '../../../store/selectors/limits';
import { selectOrgTOTPDisabled } from '../../../store/selectors/organization';
import type { LoginItemFormValues } from '../../../types/forms/item';
import { isEmptyString } from '../../../utils/string/is-empty-string';
import { ValueControl } from '../../Form/Field/Control/ValueControl';
import { Field } from '../../Form/Field/Field';
import { TextField } from '../../Form/Field/TextField';
import { UpgradeButton } from '../../Upsell/UpgradeButton';

type Props = { form: FormikContextType<LoginItemFormValues> };

/** An existing secret always stays editable so the user can retrieve
 * or remove it. Adding a new one is gated by the plan's TOTP limit
 * and by the organization policy. */
export const LoginEditTOTP: FC<Props> = ({ form }) => {
    const { needsUpgrade } = useSelector(selectTOTPLimits);
    const orgTOTPDisabled = useSelector(selectOrgTOTPDisabled);
    const hadSecret = !isEmptyString(form.initialValues.totpUri);
    const hasSecret = !isEmptyString(form.values.totpUri);

    if (orgTOTPDisabled && !hadSecret) return null;

    if (needsUpgrade && !hasSecret) {
        return (
            <ValueControl icon={IcLock} label={c('Label').t`2FA secret key (TOTP)`}>
                <UpgradeButton inline upsellRef={UpsellRef.LIMIT_2FA} />
            </ValueControl>
        );
    }

    return (
        <Field
            hidden
            name="totpUri"
            label={c('Label').t`2FA secret key (TOTP)`}
            placeholder={c('Placeholder').t`Add 2FA secret key`}
            component={TextField}
            icon={IcLock}
        />
    );
};
