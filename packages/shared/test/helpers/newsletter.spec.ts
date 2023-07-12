import { isGlobalFeatureNewsEnabled } from '@proton/shared/lib/helpers/newsletter';

describe('newsletter', () => {
    describe('isGlobalFeatureNewsEnabled', () => {
        describe('When only currentNews is provided as number', () => {
            it('should return correct value', () => {
                // 001000010001 -> Inbox News is enabled
                expect(isGlobalFeatureNewsEnabled(529)).toBeTrue();

                // 000100100010 -> No news enabled
                expect(isGlobalFeatureNewsEnabled(290)).toBeFalse();
            });
        });

        describe('When only currentNews is provided as object', () => {
            it('should return correct value', () => {
                expect(isGlobalFeatureNewsEnabled({ InboxNews: true, Beta: true, Business: true })).toBeTrue();

                expect(isGlobalFeatureNewsEnabled({ Beta: true, Business: true })).toBeFalse();
            });
        });

        describe('When both currentNews and updatedNews are provided', () => {
            describe('When updated value is defined', () => {
                it('should return true (number)', () => {
                    expect(isGlobalFeatureNewsEnabled(17, 529)).toBeTrue();
                });

                it('should return true (object)', () => {
                    expect(isGlobalFeatureNewsEnabled({ Beta: true, Business: true }, { DriveNews: true })).toBeTrue();
                });

                it('should return false (number)', () => {
                    expect(isGlobalFeatureNewsEnabled(529, 17)).toBeFalse();
                });

                it('should return false (object)', () => {
                    expect(
                        isGlobalFeatureNewsEnabled(
                            { Beta: true, Business: true, InboxNews: true },
                            { InboxNews: false }
                        )
                    ).toBeFalse();
                });
            });

            describe('When updated value is not defined', () => {
                it('should return true', () => {
                    expect(
                        isGlobalFeatureNewsEnabled({ Beta: true, Business: true, VpnNews: true }, { Business: false })
                    ).toBeTrue();
                });

                it('should return false', () => {
                    expect(
                        isGlobalFeatureNewsEnabled(
                            { Beta: true, Business: true, InboxNews: false },
                            { Business: false }
                        )
                    ).toBeFalse();
                });
            });
        });
    });
});
