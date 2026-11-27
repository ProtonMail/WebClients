import { fireEvent } from '@testing-library/react';
import type { FieldProps } from 'formik';

import { PLANS } from '@proton/payments/core/constants';
import { USER_ROLES } from '@proton/shared/lib/constants';

import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { useNavigateToUpgrade } from '../../hooks/useNavigateToUpgrade';
import {
    selectIsPassB2BPlan,
    selectIsPassBasicAdmin,
    selectUser,
    selectUserStorageAllowed,
} from '../../store/selectors/user';
import { uniqueId } from '../../utils/string/unique-id';
import { render } from '../../utils/tests/render';
import { FileAttachmentsField } from './FileAttachmentsField';

/** Branches under test are driven by these hooks/selectors. Mock them directly
 * rather than seeding the redux store, so each scenario is isolated. */
vi.mock('../../hooks/useFeatureFlag', async () => ({ useFeatureFlag: vi.fn() }));
vi.mock('../../hooks/useNavigateToUpgrade', async () => ({
    ...(await vi.importActual('../../hooks/useNavigateToUpgrade')),
    useNavigateToUpgrade: vi.fn(),
}));
vi.mock('../../store/selectors/user', async () => ({
    ...(await vi.importActual('../../store/selectors/user')),
    selectIsPassB2BPlan: vi.fn(),
    selectIsPassBasicAdmin: vi.fn(),
    selectUser: vi.fn(),
    selectUserStorageAllowed: vi.fn(),
}));

const mockUseFeatureFlag = vi.mocked(useFeatureFlag);
const mockUseNavigateToUpgrade = vi.mocked(useNavigateToUpgrade);
const mockSelectIsPassB2BPlan = vi.mocked(selectIsPassB2BPlan);
const mockSelectIsPassBasicAdmin = vi.mocked(selectIsPassBasicAdmin);
const mockSelectUser = vi.mocked(selectUser);
const mockSelectUserStorageAllowed = vi.mocked(selectUserStorageAllowed);
const mockNavigateToUpgrade = vi.fn();

describe('FileAttachmentsField', () => {
    const mockForm = {
        setStatus: vi.fn(),
        setValues: vi.fn(),
        setFieldValue: vi.fn(),
        values: { files: { toAdd: [] } },
    } as unknown as FieldProps['form'];

    const renderField = () =>
        render(<FileAttachmentsField shareId={uniqueId()} form={mockForm} field={{} as any} meta={{} as any} />);

    beforeEach(() => {
        mockUseFeatureFlag.mockReturnValue(false);
        mockUseNavigateToUpgrade.mockReturnValue(mockNavigateToUpgrade);
        mockSelectIsPassB2BPlan.mockReturnValue(false);
        mockSelectIsPassBasicAdmin.mockReturnValue(false);
        mockSelectUser.mockReturnValue(null);
        mockSelectUserStorageAllowed.mockReturnValue(false);
    });

    afterEach(() => vi.clearAllMocks());

    test('hides the field for B2B users without storage when the upsell flag is off', () => {
        mockSelectIsPassB2BPlan.mockReturnValue(true);
        mockUseFeatureFlag.mockReturnValue(false);

        const { queryByText, queryByRole } = renderField();

        expect(queryByText(/not supported in your plan/i)).toBeNull();
        expect(queryByRole('button', { name: 'Upgrade' })).toBeNull();
    });

    test('shows an inline Upgrade link for Essentials admins', () => {
        mockSelectIsPassB2BPlan.mockReturnValue(true);
        mockUseFeatureFlag.mockReturnValue(true);
        mockSelectUser.mockReturnValue({ Role: USER_ROLES.ADMIN_ROLE } as any);

        const { getByText, getByRole } = renderField();

        expect(getByText(/not supported in your plan/i)).toBeInTheDocument();

        fireEvent.click(getByRole('button', { name: 'Upgrade' }));
        expect(mockNavigateToUpgrade).toHaveBeenCalledTimes(1);
    });

    test('sends Pass Basic admins to the plan comparison on the account dashboard', () => {
        mockSelectIsPassB2BPlan.mockReturnValue(true);
        mockSelectIsPassBasicAdmin.mockReturnValue(true);
        mockUseFeatureFlag.mockReturnValue(true);
        mockSelectUser.mockReturnValue({ Role: USER_ROLES.ADMIN_ROLE } as any);

        renderField();

        expect(mockUseNavigateToUpgrade).toHaveBeenCalledWith(
            expect.objectContaining({ path: 'pass/dashboard', plan: PLANS.PASS_BASIC, targetPage: 'compare' })
        );
    });

    test('keeps the default upgrade path for Essentials admins', () => {
        mockSelectIsPassB2BPlan.mockReturnValue(true);
        mockUseFeatureFlag.mockReturnValue(true);
        mockSelectUser.mockReturnValue({ Role: USER_ROLES.ADMIN_ROLE } as any);

        renderField();

        expect(mockUseNavigateToUpgrade).toHaveBeenCalledWith(expect.not.objectContaining({ path: expect.anything() }));
    });

    test('points Essentials members to their admin instead of an Upgrade link', () => {
        mockSelectIsPassB2BPlan.mockReturnValue(true);
        mockUseFeatureFlag.mockReturnValue(true);
        mockSelectUser.mockReturnValue({ Role: USER_ROLES.MEMBER_ROLE } as any);

        const { getByText, queryByRole } = renderField();

        expect(getByText(/contact your admin/i)).toBeInTheDocument();
        expect(queryByRole('button', { name: 'Upgrade' })).toBeNull();
    });

    test('keeps the field for B2B users with storage when the upsell flag is off', () => {
        mockSelectIsPassB2BPlan.mockReturnValue(true);
        mockSelectUserStorageAllowed.mockReturnValue(true);
        mockUseFeatureFlag.mockReturnValue(false);

        const { getByText, queryByText } = renderField();

        expect(getByText(/choose a file or drag it here/i)).toBeInTheDocument();
        expect(queryByText(/not supported in your plan/i)).toBeNull();
    });

    test('shows the B2C upsell button for non-B2B users without storage', () => {
        mockSelectUserStorageAllowed.mockReturnValue(false);

        const { getByRole, queryByText } = renderField();

        expect(getByRole('button', { name: /choose a file or drag it here/i })).toBeInTheDocument();
        expect(queryByText(/not supported in your plan/i)).toBeNull();
    });
});
