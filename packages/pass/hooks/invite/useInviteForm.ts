import { useEffect, useMemo, useRef } from 'react';

import type { FormikErrors } from 'formik';
import { useFormik } from 'formik';

import { useActionRequest } from '@proton/pass/hooks/useRequest';
import { validateInvite } from '@proton/pass/lib/validation/invite';
import type { inviteBatchCreateFailure, inviteBatchCreateSuccess } from '@proton/pass/store/actions';
import { inviteBatchCreateIntent } from '@proton/pass/store/actions';
import type { InviteFormValues } from '@proton/pass/types';
import type { InviteBatchCreateSuccess } from '@proton/pass/types/data/invites.dto';
import noop from '@proton/utils/noop';

import { useAddressValidator } from './useAddressValidator';

type InviteFormOptions<V extends InviteFormValues> = {
    initialValues: V;
    onSuccess: (values: InviteBatchCreateSuccess) => void;
};

export const useInviteForm = <V extends InviteFormValues>({ initialValues, onSuccess }: InviteFormOptions<V>) => {
    const validator = useAddressValidator(initialValues.shareId);
    const emailFieldRef = useRef<HTMLInputElement>(null);

    const { dispatch, loading } = useActionRequest<
        typeof inviteBatchCreateIntent,
        typeof inviteBatchCreateSuccess,
        typeof inviteBatchCreateFailure
    >(inviteBatchCreateIntent, { onSuccess });

    const form = useFormik<V>({
        initialValues,
        initialErrors: { members: [] } as unknown as FormikErrors<V>,
        validateOnChange: true,
        validate: validateInvite({
            emailField: emailFieldRef,
            emailValidationResults: validator?.emails,
        }),
        onSubmit: (values, { setFieldValue }) => {
            if (!validator?.loading) {
                switch (values.step) {
                    case 'members':
                        return setFieldValue('step', 'permissions');
                    case 'permissions':
                        return setFieldValue('step', 'review');
                    case 'review':
                        return dispatch(values);
                }
            }
        },
    });

    useEffect(() => {
        validator
            ?.validate(form.values.members.map(({ value }) => value.email))
            .then(() => form.validateForm())
            .catch(noop);
    }, [form.values.members, validator]);

    return useMemo(() => ({ form, emailFieldRef, validator, loading }), [form, validator, loading]);
};
