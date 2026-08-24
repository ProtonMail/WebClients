import { fireEvent } from '@testing-library/react';
import type { FieldProps } from 'formik';

import { USER_ROLES } from '@proton/shared/lib/constants';

import { useFeatureFlag } from '../../hooks/useFeatureFlag';
import { useMatchUser } from '../../hooks/useMatchUser';
import { useNavigateToUpgrade } from '../../hooks/useNavigateToUpgrade';
import { selectUser, selectUserStorageAllowed } from '../../store/selectors';
import { uniqueId } from '../../utils/string/unique-id';
import { render } from '../../utils/tests/render';
import { FileAttachmentsField } from './FileAttachmentsField';

jest.mock('webextension-polyfill', () => ({}));
jest.mock('imask/esm/masked/range', () => ({}));

/** Branches under test are driven by these hooks/selectors. Mock them directly
 * rather than seeding the redux store, so each scenario is isolated. */
jest.mock('../../hooks/useFeatureFlag', () => ({ useFeatureFlag: jest.fn() }));
jest.mock('../../hooks/useMatchUser', () => ({ useMatchUser: jest.fn() }));
jest.mock('../../hooks/useNavigateToUpgrade', () => ({ useNavigateToUpgrade: jest.fn() }));
jest.mock('../../store/selectors', () => ({
    ...jest.requireActual('../../store/selectors'),
    selectUser: jest.fn(),
    selectUserStorageAllowed: jest.fn(),
}));

const mockUseFeatureFlag = jest.mocked(useFeatureFlag);
const mockUseMatchUser = jest.mocked(useMatchUser);
const mockUseNavigateToUpgrade = jest.mocked(useNavigateToUpgrade);
const mockSelectUser = jest.mocked(selectUser);
const mockSelectUserStorageAllowed = jest.mocked(selectUserStorageAllowed);
const mockNavigateToUpgrade = jest.fn();

describe('FileAttachmentsField', () => {
    const mockForm = {
        setStatus: jest.fn(),
        setValues: jest.fn(),
        setFieldValue: jest.fn(),
        values: { files: { toAdd: [] } },
    } as unknown as FieldProps['form'];

    const renderField = () =>
        render(<FileAttachmentsField shareId={uniqueId()} form={mockForm} field={{} as any} meta={{} as any} />);

    beforeEach(() => {
        mockUseFeatureFlag.mockReturnValue(false);
        mockUseMatchUser.mockReturnValue(false);
        mockUseNavigateToUpgrade.mockReturnValue(mockNavigateToUpgrade);
        mockSelectUser.mockReturnValue(null);
        mockSelectUserStorageAllowed.mockReturnValue(false);
    });

    afterEach(() => jest.clearAllMocks());

    test('hides the field for Essentials users when the upsell flag is off', () => {
        mockUseMatchUser.mockReturnValue(true);
        mockUseFeatureFlag.mockReturnValue(false);

        const { queryByText, queryByRole } = renderField();

        expect(queryByText(/not supported in your plan/i)).toBeNull();
        expect(queryByRole('button', { name: 'Upgrade' })).toBeNull();
    });

    test('shows an inline Upgrade link for Essentials admins', () => {
        mockUseMatchUser.mockReturnValue(true);
        mockUseFeatureFlag.mockReturnValue(true);
        mockSelectUser.mockReturnValue({ Role: USER_ROLES.ADMIN_ROLE } as any);

        const { getByText, getByRole } = renderField();

        expect(getByText(/not supported in your plan/i)).toBeInTheDocument();

        fireEvent.click(getByRole('button', { name: 'Upgrade' }));
        expect(mockNavigateToUpgrade).toHaveBeenCalledTimes(1);
    });

    test('points Essentials members to their admin instead of an Upgrade link', () => {
        mockUseMatchUser.mockReturnValue(true);
        mockUseFeatureFlag.mockReturnValue(true);
        mockSelectUser.mockReturnValue({ Role: USER_ROLES.MEMBER_ROLE } as any);

        const { getByText, queryByRole } = renderField();

        expect(getByText(/contact your admin/i)).toBeInTheDocument();
        expect(queryByRole('button', { name: 'Upgrade' })).toBeNull();
    });

    test('shows the B2C upsell button for non-Essentials users without storage', () => {
        mockUseMatchUser.mockReturnValue(false);
        mockSelectUserStorageAllowed.mockReturnValue(false);

        const { getByRole, queryByText } = renderField();

        expect(getByRole('button', { name: /choose a file or drag it here/i })).toBeInTheDocument();
        expect(queryByText(/not supported in your plan/i)).toBeNull();
    });
});
