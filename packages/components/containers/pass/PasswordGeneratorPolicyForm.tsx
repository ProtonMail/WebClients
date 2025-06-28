import { type FC } from 'react';

import type { FormikErrors } from 'formik';
import { Form, FormikProvider, useFormik } from 'formik';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { Maybe, MaybeNull, OrganizationUpdatePasswordPolicyRequest } from '@proton/pass/types';

import { PasswordGeneratorPolicyOption } from './PasswordGeneratorOption';

export type PasswordGeneratorOptionValue = Maybe<boolean | number | null>;

const FORM_ID = 'password-generator-form';

const PASSWORD_GENERATOR_DEFAULT: OrganizationUpdatePasswordPolicyRequest = {
    RandomPasswordAllowed: true,
    RandomPasswordMinLength: 4,
    RandomPasswordMaxLength: 64,
    RandomPasswordMustIncludeNumbers: null,
    RandomPasswordMustIncludeSymbols: null,
    RandomPasswordMustIncludeUppercase: null,
    MemorablePasswordAllowed: true,
    MemorablePasswordMinWords: 1,
    MemorablePasswordMaxWords: 10,
    MemorablePasswordMustCapitalize: null,
    MemorablePasswordMustIncludeNumbers: null,
};

export type PasswordLength = {
    min: number;
    max: number;
};
type PasswordGeneratorRule = {
    id: keyof OrganizationUpdatePasswordPolicyRequest;
    label: string;
    length?: PasswordLength;
};

const randomPasswordRules: PasswordGeneratorRule[] = [
    {
        label: c('Label').t`Allow random passwords`,
        id: 'RandomPasswordAllowed',
    },
    {
        label: c('Label').t`Minimum number of characters`,
        id: 'RandomPasswordMinLength',
        length: { min: 4, max: 64 },
    },
    {
        label: c('Label').t`Maximum number of characters`,
        id: 'RandomPasswordMaxLength',
        length: { min: 4, max: 64 },
    },
    {
        label: c('Label').t`Numbers`,
        id: 'RandomPasswordMustIncludeNumbers',
    },
    {
        label: c('Label').t`Special characters`,
        id: 'RandomPasswordMustIncludeSymbols',
    },
    {
        label: c('Label').t`Uppercase`,
        id: 'RandomPasswordMustIncludeUppercase',
    },
];

const memorablePasswordRules: PasswordGeneratorRule[] = [
    {
        label: c('Label').t`Allow memorable passwords`,
        id: 'MemorablePasswordAllowed',
    },
    {
        label: c('Label').t`Minimum number of words`,
        id: 'MemorablePasswordMinWords',
        length: { min: 1, max: 10 },
    },
    {
        label: c('Label').t`Maximum number of words`,
        id: 'MemorablePasswordMaxWords',
        length: { min: 1, max: 10 },
    },
    {
        label: c('Label').t`Numbers`,
        id: 'MemorablePasswordMustIncludeNumbers',
    },
    {
        label: c('Label').t`Capitalize words`,
        id: 'MemorablePasswordMustCapitalize',
    },
];

export const getRangeError = (type: 'character' | 'word', value?: MaybeNull<number>) => {
    const minimumNumber = type === 'character' ? 4 : 1;
    const maximumNumber = type === 'character' ? 64 : 10;

    if (!value && value !== 0) {
        return c('Warning').t`Must be between ${minimumNumber} and ${maximumNumber}`;
    }

    if (value > maximumNumber) {
        return c('Warning').t`Must be lower than or equal to ${maximumNumber}`;
    }

    if (value < minimumNumber) {
        return c('Warning').t`Must be greater than or equal to ${minimumNumber}`;
    }

    return undefined;
};

export const validatePasswordGeneratorForm = (
    values: OrganizationUpdatePasswordPolicyRequest
): FormikErrors<OrganizationUpdatePasswordPolicyRequest> => {
    const errors: FormikErrors<OrganizationUpdatePasswordPolicyRequest> = {};

    const randomMinError = getRangeError('character', values.RandomPasswordMinLength);
    if (randomMinError) {
        errors.RandomPasswordMinLength = randomMinError;
    }

    const randomMaxError = getRangeError('character', values.RandomPasswordMaxLength);
    if (randomMaxError) {
        errors.RandomPasswordMaxLength = randomMaxError;
    }

    const wordMinError = getRangeError('word', values.MemorablePasswordMinWords);
    if (wordMinError) {
        errors.MemorablePasswordMinWords = wordMinError;
    }

    const wordMaxError = getRangeError('word', values.MemorablePasswordMaxWords);
    if (wordMaxError) {
        errors.MemorablePasswordMaxWords = wordMaxError;
    }

    if (
        values.RandomPasswordMinLength &&
        values.RandomPasswordMaxLength &&
        values.RandomPasswordMaxLength < values.RandomPasswordMinLength
    ) {
        errors.RandomPasswordMaxLength = c('Warning').t`Maximum cannot be lower than minimum`;
    }

    if (
        values.MemorablePasswordMinWords &&
        values.MemorablePasswordMaxWords &&
        values.MemorablePasswordMaxWords < values.MemorablePasswordMinWords
    ) {
        errors.MemorablePasswordMaxWords = c('Warning').t`Maximum cannot be lower than minimum`;
    }

    return errors;
};

type Props = {
    config: MaybeNull<OrganizationUpdatePasswordPolicyRequest>;
    onSubmit: (config: OrganizationUpdatePasswordPolicyRequest) => Promise<void>;
    loading?: boolean;
};

export const PasswordGeneratorPolicyForm: FC<Props> = ({ onSubmit, config, loading }) => {
    const form = useFormik<OrganizationUpdatePasswordPolicyRequest>({
        initialValues: config ?? PASSWORD_GENERATOR_DEFAULT,
        validate: validatePasswordGeneratorForm,
        onSubmit: async (values) => {
            await onSubmit(values);
            form.resetForm({ values });
        },
    });

    const handleOnChange = (id: keyof OrganizationUpdatePasswordPolicyRequest, value: PasswordGeneratorOptionValue) => {
        void form.setFieldValue(id, value);

        // Don't allow both RandomPasswordAllowed & MemorablePasswordAllowed toggles to be off
        if (id === 'RandomPasswordAllowed' && value === false && form.values.MemorablePasswordAllowed === false) {
            void form.setFieldValue('MemorablePasswordAllowed', true);
        } else if (
            id === 'MemorablePasswordAllowed' &&
            value === false &&
            form.values.RandomPasswordAllowed === false
        ) {
            void form.setFieldValue('RandomPasswordAllowed', true);
        }
    };

    return (
        <>
            <FormikProvider value={form}>
                <Form id={FORM_ID}>
                    <div>
                        {randomPasswordRules.map(({ label, id, length }) => (
                            <PasswordGeneratorPolicyOption
                                label={label}
                                id={id}
                                onChange={(value) => handleOnChange(id, value)}
                                value={form.values[id]}
                                length={length}
                                disabled={!form.values.RandomPasswordAllowed}
                                error={form.errors[id]}
                                key={`option-${id}`}
                            />
                        ))}
                        <hr className="my-4" />
                        {memorablePasswordRules.map(({ label, id, length }) => (
                            <PasswordGeneratorPolicyOption
                                label={label}
                                id={id}
                                onChange={(value) => handleOnChange(id, value)}
                                value={form.values[id]}
                                length={length}
                                disabled={!form.values.MemorablePasswordAllowed}
                                error={form.errors[id]}
                                key={`option-${id}`}
                            />
                        ))}
                    </div>
                </Form>
            </FormikProvider>
            <Button
                type="submit"
                form={FORM_ID}
                color="norm"
                disabled={!form.isValid || !form.dirty}
                loading={loading}
                className="mr-8"
            >
                {c('Action').t`Save`}
            </Button>
            {form.dirty && (
                <Button color="norm" shape="ghost" type="reset" form={FORM_ID}>
                    {c('Action').t`Reset modifications`}
                </Button>
            )}
        </>
    );
};
