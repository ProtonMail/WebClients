import { fireEvent } from '@testing-library/react';
import { Formik } from 'formik';

import { selectTOTPLimits } from '../../../store/selectors/limits';
import { selectOrgTOTPDisabled } from '../../../store/selectors/organization';
import type { LoginItemFormValues } from '../../../types/forms/item';
import { render } from '../../../utils/tests/render';
import { LoginEditTOTP } from './Login.edit.totp';

vi.mock('webextension-polyfill', () => ({ default: {} }));

vi.mock('../../../store/selectors/limits', async () => ({
    ...(await vi.importActual('../../../store/selectors/limits')),
    selectTOTPLimits: vi.fn(),
}));

vi.mock('../../../store/selectors/organization', async () => ({
    ...(await vi.importActual('../../../store/selectors/organization')),
    selectOrgTOTPDisabled: vi.fn(),
}));

const mockSelectOrgTOTPDisabled = vi.mocked(selectOrgTOTPDisabled);
const mockSelectTOTPLimits = vi.mocked(selectTOTPLimits);

const SECRET = 'otpauth://totp/test?secret=JBSWY3DPEHPK3PXP';

const renderField = (totpUri: string) =>
    render(
        <Formik<Partial<LoginItemFormValues>> initialValues={{ totpUri }} onSubmit={vi.fn()}>
            {(form) => <LoginEditTOTP form={form as any} />}
        </Formik>
    );

const getTOTPInput = (container: HTMLElement) => container.querySelector<HTMLInputElement>('input[name="totpUri"]');

describe('LoginEditTOTP', () => {
    const setPolicy = ({ orgTOTPDisabled = false, needsUpgrade = false }) => {
        mockSelectOrgTOTPDisabled.mockReturnValue(orgTOTPDisabled);
        mockSelectTOTPLimits.mockReturnValue({ needsUpgrade } as ReturnType<typeof selectTOTPLimits>);
    };

    afterEach(() => vi.clearAllMocks());

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
