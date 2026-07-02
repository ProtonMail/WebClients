import { isGlobalFeatureNewsEnabled } from '@proton/shared/lib/helpers/newsletter';

describe('newsletter', () => {
    describe('isGlobalFeatureNewsEnabled', () => {
        describe('When only currentNews is provided as number', () => {
            it('should return correct value', () => {
                // 001000010001 -> Inbox News is enabled
                expect(isGlobalFeatureNewsEnabled(529)).toBe(true);

                // 000100100010 -> No news enabled
                expect(isGlobalFeatureNewsEnabled(290)).toBe(false);
            });
        });

        describe('When only currentNews is provided as object', () => {
            it('should return correct value', () => {
                expect(isGlobalFeatureNewsEnabled({ InboxNews: true, Beta: true, Business: true })).toBe(true);

                expect(isGlobalFeatureNewsEnabled({ Beta: true, Business: true })).toBe(false);
            });
        });

        describe('When both currentNews and updatedNews are provided', () => {
            describe('When updated value is defined', () => {
                it('should return true (number)', () => {
                    expect(isGlobalFeatureNewsEnabled(17, 529)).toBe(true);
                });

                it('should return true (object)', () => {
                    expect(isGlobalFeatureNewsEnabled({ Beta: true, Business: true }, { DriveNews: true })).toBe(true);
                });

                it('should return false (number)', () => {
                    expect(isGlobalFeatureNewsEnabled(529, 17)).toBe(false);
                });

                it('should return false (object)', () => {
                    expect(
                        isGlobalFeatureNewsEnabled(
                            { Beta: true, Business: true, InboxNews: true },
                            { InboxNews: false }
                        )
                    ).toBe(false);
                });
            });

            describe('When updated value is not defined', () => {
                it('should return true', () => {
                    expect(
                        isGlobalFeatureNewsEnabled({ Beta: true, Business: true, VpnNews: true }, { Business: false })
                    ).toBe(true);
                });

                it('should return false', () => {
                    expect(
                        isGlobalFeatureNewsEnabled(
                            { Beta: true, Business: true, InboxNews: false },
                            { Business: false }
                        )
                    ).toBe(false);
                });
            });
        });
    });
});
