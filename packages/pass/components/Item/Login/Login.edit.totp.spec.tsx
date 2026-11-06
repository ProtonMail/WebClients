import { fireEvent } from '@testing-library/react';
import { Formik } from 'formik';

import { selectTOTPLimits } from '../../../store/selectors/limits';
import { selectOrgTOTPDisabled } from '../../../store/selectors/organization';
import type { LoginItemFormValues } from '../../../types/forms/item';
import { render } from '../../../utils/tests/render';
import { LoginEditTOTP } from './Login.edit.totp';

jest.mock('webextension-polyfill', () => ({}));
jest.mock('imask/esm/masked/range', () => ({}));

jest.mock('../../../store/selectors/limits', () => ({
    ...jest.requireActual('../../../store/selectors/limits'),
    selectTOTPLimits: jest.fn(),
}));

jest.mock('../../../store/selectors/organization', () => ({
    ...jest.requireActual('../../../store/selectors/organization'),
    selectOrgTOTPDisabled: jest.fn(),
}));

const mockSelectOrgTOTPDisabled = jest.mocked(selectOrgTOTPDisabled);
const mockSelectTOTPLimits = jest.mocked(selectTOTPLimits);

const SECRET = 'otpauth://totp/test?secret=JBSWY3DPEHPK3PXP';

const renderField = (totpUri: string) =>
    render(
        <Formik<Partial<LoginItemFormValues>> initialValues={{ totpUri }} onSubmit={jest.fn()}>
            {(form) => <LoginEditTOTP form={form as any} />}
        </Formik>
    );

const getTOTPInput = (container: HTMLElement) => container.querySelector<HTMLInputElement>('input[name="totpUri"]');

describe('LoginEditTOTP', () => {
    const setPolicy = ({ orgTOTPDisabled = false, needsUpgrade = false }) => {
        mockSelectOrgTOTPDisabled.mockReturnValue(orgTOTPDisabled);
        mockSelectTOTPLimits.mockReturnValue({ needsUpgrade } as ReturnType<typeof selectTOTPLimits>);
    };

    afterEach(() => jest.clearAllMocks());

    test('renders the secret field when nothing restricts TOTP', () => {
        setPolicy({});
        const { container, queryByText } = renderField('');
        expect(getTOTPInput(container)).not.toBeNull();
        expect(queryByText('Upgrade')).toBeNull();
    });

    test('renders nothing when the organization disallows TOTP and the item has no secret', () => {
        setPolicy({ orgTOTPDisabled: true });
        const { container, queryByText } = renderField('');
        expect(getTOTPInput(container)).toBeNull();
        expect(queryByText('2FA secret key (TOTP)')).toBeNull();
    });

    test('keeps an existing secret editable when the organization disallows TOTP', () => {
        setPolicy({ orgTOTPDisabled: true });
        const { container } = renderField(SECRET);
        const input = getTOTPInput(container)!;
        fireEvent.focus(input);
        expect(input.value).toBe(SECRET);
    });

    test('shows the upsell instead of the field when the plan limit is reached', () => {
        setPolicy({ needsUpgrade: true });
        const { container, getByText } = renderField('');
        expect(getTOTPInput(container)).toBeNull();
        expect(getByText('Upgrade')).toBeTruthy();
    });
});
