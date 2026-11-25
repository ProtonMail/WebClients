import { renderHook } from '@testing-library/react';

import type { RecoveryCondition } from '@proton/account/recovery/recoveryConditions';
import { ThemeColor } from '@proton/colors/types';

import { useRecoveryIndicator } from './useRecoveryIndicators';

let mockConditions: RecoveryCondition[] = [];
let mockIsSecurityCenterEnabled = false;

vi.mock('@proton/redux-shared-store/sharedProvider', () => ({ useSelector: () => mockConditions }));
vi.mock('@proton/features/useFeature', () => ({ default: () => ({}) }));
vi.mock('../components/drawer/views/SecurityCenter/useSecurityCenter', () => ({
    default: () => mockIsSecurityCenterEnabled,
}));

describe('useRecoveryIndicator', () => {
    beforeEach(() => {
        mockConditions = ['locked-data', 'outdated-file', 'phrase-not-set'];
        mockIsSecurityCenterEnabled = false;
    });

    it.each<[RecoveryCondition, { color: ThemeColor; text: string; path: string }]>([
        ['locked-data', { color: ThemeColor.Danger, text: 'Unlock data', path: '/recovery?action=recover-data' }],
        ['outdated-file', { color: ThemeColor.Danger, text: 'Update recovery file', path: '/recovery#data' }],
        [
            'phrase-not-set',
            {
                color: ThemeColor.Warning,
                text: 'Set recovery phrase',
                path: '/recovery?action=generate-recovery-phrase',
            },
        ],
    ])('gives %s its colour, text and link', (condition, display) => {
        mockConditions = [condition];

        const { result } = renderHook(() => useRecoveryIndicator('settingsSidebar'));

        expect(result.current).toEqual(expect.objectContaining({ condition, ...display }));
    });

    it.each<[RecoveryCondition, string]>([
        ['outdated-phrase', 'Your recovery phrase is out of date. Get a new one so you can still recover your data.'],
        ['outdated-file', 'Your recovery file is out of date. Download a new one so you can still recover your data.'],
        ['locked-data', 'Some of your data is locked. Use a recovery method to unlock it.'],
        ['sentinel-phrase-missing', 'Generate a recovery phrase to protect your account against data loss.'],
        ['phrase-not-set', 'Create a recovery phrase so you can recover your data if you forget your password.'],
        ['account-recovery-missing', 'Add a recovery email or phone so you can reset your password if you forget it.'],
        ['data-recovery-missing', 'Add a data recovery method to unlock your data if you forget your password.'],
    ])('shows the %s tooltip on the sidebar dot', (condition, tooltip) => {
        mockConditions = [condition];

        const { result } = renderHook(() => useRecoveryIndicator('settingsSidebar'));

        expect(result.current?.tooltip).toBe(tooltip);
    });

    it('leaves out of quick settings what the security center already shows', () => {
        mockConditions = ['outdated-file', 'phrase-not-set'];

        expect(renderHook(() => useRecoveryIndicator('quickSettings')).result.current?.condition).toBe('outdated-file');

        mockIsSecurityCenterEnabled = true;

        expect(renderHook(() => useRecoveryIndicator('quickSettings')).result.current).toBeUndefined();
        expect(renderHook(() => useRecoveryIndicator('settingsSidebar')).result.current?.condition).toBe(
            'outdated-file'
        );
    });

    it("keeps main's quick settings wording for Sentinel users without a phrase", () => {
        mockConditions = ['sentinel-phrase-missing'];

        const { result } = renderHook(() => useRecoveryIndicator('quickSettings'));

        expect(result.current?.text).toBe('Update recovery phrase');
    });

    it('returns the most important indicator for a single dot', () => {
        const { result } = renderHook(() => useRecoveryIndicator('settingsSidebar'));

        expect(result.current?.condition).toBe('locked-data');
    });
});
