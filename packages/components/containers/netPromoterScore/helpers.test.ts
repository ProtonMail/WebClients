import { FeatureCode } from '@proton/features';

import { getFeatureCode, isAccountOlderThanMinimum } from './helpers';
import { NPSApplication } from './interface';

describe('helper functions', () => {
    describe('chooseFeatureCode', () => {
        it('returns NPSFeedbackWebMail for WebMail application', () => {
            const result = getFeatureCode(NPSApplication.WebMail);

            expect(result).toBe(FeatureCode.NPSFeedbackWebMail);
        });

        it('returns NPSFeedbackWebCalendar for WebCalendar application', () => {
            const result = getFeatureCode(NPSApplication.WebCalendar);

            expect(result).toBe(FeatureCode.NPSFeedbackWebCalendar);
        });

        it('returns NPSFeedbackDesktopMail for DesktopMail application', () => {
            const result = getFeatureCode(NPSApplication.DesktopMail);

            expect(result).toBe(FeatureCode.NPSFeedbackDesktopMail);
        });

        it('returns NPSFeedbackDesktopCalendar for DesktopCalendar application', () => {
            const result = getFeatureCode(NPSApplication.DesktopCalendar);

            expect(result).toBe(FeatureCode.NPSFeedbackDesktopCalendar);
        });
    });

    describe('isAccountOlderThanMinimum', () => {
        const MINIMUM_DAYS = 30;
        const now = Math.floor(Date.now() / 1000);

        it('returns true if account is older than minimum days', () => {
            // 31 days ago
            const oldCreateTime = now - 60 * 60 * 24 * (MINIMUM_DAYS + 1);
            expect(isAccountOlderThanMinimum(oldCreateTime, MINIMUM_DAYS)).toBe(true);
        });

        it('returns true if account is exactly at the minimum days', () => {
            // edge: exactly 30 days ago
            const boundaryCreateTime = now - 60 * 60 * 24 * MINIMUM_DAYS;
            expect(isAccountOlderThanMinimum(boundaryCreateTime, MINIMUM_DAYS)).toBe(true);
        });

        it('returns false if account is newer than minimum days', () => {
            // 29 days ago
            const newCreateTime = now - 60 * 60 * 24 * (MINIMUM_DAYS - 1);
            expect(isAccountOlderThanMinimum(newCreateTime, MINIMUM_DAYS)).toBe(false);
        });

        it('returns false if createTime is undefined', () => {
            expect(isAccountOlderThanMinimum(undefined, MINIMUM_DAYS)).toBe(false);
        });
    });
});
