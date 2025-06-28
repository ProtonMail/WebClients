import { render, screen } from '@testing-library/react';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useConfig from '@proton/components/hooks/useConfig';
import { UserLockedFlags, type UserModel } from '@proton/shared/lib/interfaces';

import StorageLimitTopBanner from './StorageLimitTopBanner';

jest.mock('react-router-dom', () => ({
    useLocation: jest.fn().mockReturnValue({ pathname: '' }),
}));

jest.mock('@proton/components/components/link/AppLink');

jest.mock('@proton/account/user/hooks');
const mockedUser = useUser as jest.Mock;

jest.mock('@proton/account/subscription/hooks');
const mockedSub = useSubscription as jest.Mock;

jest.mock('@proton/components/hooks/useConfig');
const mockConfig = useConfig as jest.Mock;

const userWithNearFullPooledStorage: Partial<UserModel> = {
    MaxSpace: 1000,
    UsedSpace: 990,
    ProductUsedSpace: {
        Calendar: 0,
        Contact: 0,
        Drive: 0,
        Mail: 0,
        Pass: 0,
    },
};
const userWithFullPooledStorage: Partial<UserModel> = {
    ...userWithNearFullPooledStorage,
    UsedSpace: 1000,
};

const userWithNearFullMailSplitStorage: Partial<UserModel> = {
    MaxBaseSpace: 1000,
    UsedBaseSpace: 990,
};
const userWithFullMailSplitStorage: Partial<UserModel> = {
    ...userWithNearFullMailSplitStorage,
    UsedBaseSpace: 1000,
};

const userWithNearFullDriveSplitStorage: Partial<UserModel> = {
    MaxBaseSpace: 1000,
    MaxDriveSpace: 1000,
    UsedDriveSpace: 990,
};
const userWithFullDriveSplitStorage: Partial<UserModel> = {
    ...userWithNearFullDriveSplitStorage,
    UsedDriveSpace: 1000,
};

const userWithNearFullBothSplitStorage: Partial<UserModel> = {
    MaxBaseSpace: 1000,
    MaxDriveSpace: 1000,
    UsedBaseSpace: 990,
    UsedDriveSpace: 990,
};
const userWithFullBothSplitStorage: Partial<UserModel> = {
    ...userWithNearFullBothSplitStorage,
    UsedBaseSpace: 1000,
    UsedDriveSpace: 1000,
};

describe('StorageLimitTopBanner', () => {
    describe('User with pooled storage', () => {
        describe('Near full', () => {
            it('Should show the nearly full banner on Mail', () => {
                mockedUser.mockReturnValue([userWithNearFullPooledStorage]);
                mockedSub.mockReturnValue([]);
                mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

                render(<StorageLimitTopBanner app="proton-mail" />);
                const banner = screen.getByTestId('storage-banner:pooled-storage');
                expect(banner).toBeInTheDocument();
                expect(banner.innerHTML).toContain(
                    'Your storage is 99% full. To continue using Proton products, free up space or'
                );
            });

            it('Should show the nearly full banner on Drive', () => {
                mockedUser.mockReturnValue([userWithNearFullPooledStorage]);
                mockedSub.mockReturnValue([]);
                mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

                render(<StorageLimitTopBanner app="proton-drive" />);
                const banner = screen.getByTestId('storage-banner:pooled-storage');
                expect(banner).toBeInTheDocument();
                expect(banner.innerHTML).toContain(
                    'Your storage is 99% full. To continue using Proton products, free up space or'
                );
            });
        });

        describe('Full', () => {
            it('Should show the full banner on Mail', () => {
                mockedUser.mockReturnValue([userWithFullPooledStorage]);
                mockedSub.mockReturnValue([]);
                mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

                render(<StorageLimitTopBanner app="proton-mail" />);
                const banner = screen.getByTestId('storage-banner:pooled-storage');
                expect(banner).toBeInTheDocument();
                expect(banner.innerHTML).toContain(
                    'Your storage is full. To continue using Proton products, free up space or'
                );
            });

            it('Should show the full banner on Drive', () => {
                mockedUser.mockReturnValue([userWithFullPooledStorage]);
                mockedSub.mockReturnValue([]);
                mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

                render(<StorageLimitTopBanner app="proton-drive" />);
                const banner = screen.getByTestId('storage-banner:pooled-storage');
                expect(banner).toBeInTheDocument();
                expect(banner.innerHTML).toContain(
                    'Your storage is full. To continue using Proton products, free up space or'
                );
            });
        });
    });

    describe('User with split storage', () => {
        describe('Near full', () => {
            it('Should show the nearly full banner when Mail storage is nearly full in Mail app', () => {
                mockedUser.mockReturnValue([userWithNearFullMailSplitStorage]);
                mockedSub.mockReturnValue([]);
                mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

                render(<StorageLimitTopBanner app="proton-mail" />);
                const banner = screen.getByTestId('storage-banner:split-storage');
                expect(banner).toBeInTheDocument();
                expect(banner.innerHTML).toContain(
                    'Your Mail storage is 99% full. To send or receive emails, free up space or'
                );
            });

            it('Should show the nearly full banner when Mail storage is nearly full in Drive app', () => {
                mockedUser.mockReturnValue([userWithNearFullMailSplitStorage]);
                mockedSub.mockReturnValue([]);
                mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

                render(<StorageLimitTopBanner app="proton-drive" />);
                const banner = screen.getByTestId('storage-banner:split-storage');
                expect(banner).toBeInTheDocument();
                expect(banner.innerHTML).toContain(
                    'Your Mail storage is 99% full. To send or receive emails, free up space or'
                );
            });

            it('Should show the nearly full banner when Drive storage is nearly full in Drive app', () => {
                mockedUser.mockReturnValue([userWithNearFullDriveSplitStorage]);
                mockedSub.mockReturnValue([]);
                mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

                render(<StorageLimitTopBanner app="proton-drive" />);
                const banner = screen.getByTestId('storage-banner:split-storage');
                expect(banner).toBeInTheDocument();
                expect(banner.innerHTML).toContain(
                    'Your Drive storage is 99% full. To upload or sync files, free up space or'
                );
            });

            it('Should show the nearly full banner when Drive storage is nearly full in Mail app', () => {
                mockedUser.mockReturnValue([userWithNearFullDriveSplitStorage]);
                mockedSub.mockReturnValue([]);
                mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

                render(<StorageLimitTopBanner app="proton-mail" />);
                const banner = screen.getByTestId('storage-banner:split-storage');
                expect(banner).toBeInTheDocument();
                expect(banner.innerHTML).toContain(
                    'Your Drive storage is 99% full. To upload or sync files, free up space or'
                );
            });

            describe('User with both storage nearly full', () => {
                it('Should show the nearly full banner when both storage are nearly full in Mail app', () => {
                    mockedUser.mockReturnValue([userWithNearFullBothSplitStorage]);
                    mockedSub.mockReturnValue([]);
                    mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

                    render(<StorageLimitTopBanner app="proton-mail" />);
                    const banner = screen.getByTestId('storage-banner:split-storage');
                    expect(banner).toBeInTheDocument();
                    expect(banner.innerHTML).toContain(
                        'Your storage is 99% full. To continue using Proton products, free up space or'
                    );
                });

                it('Should show the nearly full banner when both storage are nearly full in Drive app', () => {
                    mockedUser.mockReturnValue([userWithNearFullBothSplitStorage]);
                    mockedSub.mockReturnValue([]);
                    mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

                    render(<StorageLimitTopBanner app="proton-drive" />);
                    const banner = screen.getByTestId('storage-banner:split-storage');
                    expect(banner).toBeInTheDocument();
                    expect(banner.innerHTML).toContain(
                        'Your storage is 99% full. To continue using Proton products, free up space or'
                    );
                });
            });
        });

        describe('Full', () => {
            it('Should show the full banner when Mail storage is full in Mail app', () => {
                mockedUser.mockReturnValue([userWithFullMailSplitStorage]);
                mockedSub.mockReturnValue([]);
                mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

                render(<StorageLimitTopBanner app="proton-mail" />);
                const banner = screen.getByTestId('storage-banner:split-storage');
                expect(banner).toBeInTheDocument();
                expect(banner.innerHTML).toContain(
                    'Your Mail storage is full. To send or receive emails, free up space or'
                );
            });

            it('Should show the full banner when Mail storage is full in Drive app', () => {
                mockedUser.mockReturnValue([userWithFullMailSplitStorage]);
                mockedSub.mockReturnValue([]);
                mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

                render(<StorageLimitTopBanner app="proton-drive" />);
                const banner = screen.getByTestId('storage-banner:split-storage');
                expect(banner).toBeInTheDocument();
                expect(banner.innerHTML).toContain(
                    'Your Mail storage is full. To send or receive emails, free up space or'
                );
            });

            it('Should show the full banner when Drive storage is nearly full in Drive app', () => {
                mockedUser.mockReturnValue([userWithFullDriveSplitStorage]);
                mockedSub.mockReturnValue([]);
                mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

                render(<StorageLimitTopBanner app="proton-drive" />);
                const banner = screen.getByTestId('storage-banner:split-storage');
                expect(banner).toBeInTheDocument();
                expect(banner.innerHTML).toContain(
                    'Your Drive storage is full. To upload or sync files, free up space or'
                );
            });

            it('Should show the full banner when Drive storage is nearly full in Mail app', () => {
                mockedUser.mockReturnValue([userWithFullDriveSplitStorage]);
                mockedSub.mockReturnValue([]);
                mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

                render(<StorageLimitTopBanner app="proton-mail" />);
                const banner = screen.queryByTestId('storage-banner:split-storage');
                expect(banner).not.toBeInTheDocument();
            });

            describe('User with both storage full', () => {
                it('Should show the nearly full banner when both storage are nearly full in Mail app', () => {
                    mockedUser.mockReturnValue([userWithFullBothSplitStorage]);
                    mockedSub.mockReturnValue([]);
                    mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

                    render(<StorageLimitTopBanner app="proton-mail" />);
                    const banner = screen.getByTestId('storage-banner:split-storage');
                    expect(banner).toBeInTheDocument();
                    expect(banner.innerHTML).toContain(
                        'Your storage is full. To continue using Proton products, free up space or'
                    );
                });

                it('Should show the nearly full banner when both storage are nearly full in Drive app', () => {
                    mockedUser.mockReturnValue([userWithFullBothSplitStorage]);
                    mockedSub.mockReturnValue([]);
                    mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

                    render(<StorageLimitTopBanner app="proton-drive" />);
                    const banner = screen.getByTestId('storage-banner:split-storage');
                    expect(banner).toBeInTheDocument();
                    expect(banner.innerHTML).toContain(
                        'Your storage is full. To continue using Proton products, free up space or'
                    );
                });
            });
        });
    });

    describe('User with lock state', () => {
        it('Should show the lock state for base storage excess', () => {
            mockedUser.mockReturnValue([{ LockedFlags: UserLockedFlags.BASE_STORAGE_EXCEEDED }]);
            mockedSub.mockReturnValue([]);
            mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

            render(<StorageLimitTopBanner app="proton-mail" />);
            const banner = screen.getByTestId('storage-banner:lock-state');
            expect(banner).toBeInTheDocument();
            expect(banner.innerHTML).toContain(
                'Your Mail storage is full. To send or receive emails, free up space or'
            );
        });

        it('Should show the lock state for drive storage excess', () => {
            mockedUser.mockReturnValue([{ LockedFlags: UserLockedFlags.DRIVE_STORAGE_EXCEEDED }]);
            mockedSub.mockReturnValue([]);
            mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

            render(<StorageLimitTopBanner app="proton-mail" />);
            const banner = screen.getByTestId('storage-banner:lock-state');
            expect(banner).toBeInTheDocument();
            expect(banner.innerHTML).toContain('Your Drive storage is full. To upload or sync files, free up space or');
        });

        it('Should show the lock state for base storage excess', () => {
            mockedUser.mockReturnValue([{ LockedFlags: UserLockedFlags.STORAGE_EXCEEDED }]);
            mockedSub.mockReturnValue([]);
            mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

            render(<StorageLimitTopBanner app="proton-mail" />);
            const banner = screen.getByTestId('storage-banner:lock-state');
            expect(banner).toBeInTheDocument();
            expect(banner.innerHTML).toContain(
                'Your storage is full. To continue using Proton products, free up space or'
            );
        });

        it('Should show the lock state for org primary admin storage excess', () => {
            mockedUser.mockReturnValue([{ LockedFlags: UserLockedFlags.ORG_ISSUE_FOR_PRIMARY_ADMIN }]);
            mockedSub.mockReturnValue([]);
            mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

            render(<StorageLimitTopBanner app="proton-mail" />);
            const banner = screen.getByTestId('storage-banner:lock-state');
            expect(banner).toBeInTheDocument();
            expect(banner.innerHTML).toContain('Your subscription has ended.');
            expect(banner.innerHTML).toContain('and to avoid data loss.');
        });

        it('Should show the lock state for org member storage excess', () => {
            mockedUser.mockReturnValue([{ LockedFlags: UserLockedFlags.ORG_ISSUE_FOR_MEMBER }]);
            mockedSub.mockReturnValue([]);
            mockConfig.mockReturnValue({ APP_NAME: 'proton-account' });

            render(<StorageLimitTopBanner app="proton-mail" />);
            const banner = screen.getByTestId('storage-banner:lock-state');
            expect(banner).toBeInTheDocument();
            expect(banner.innerHTML).toContain(
                'Your account is at risk of deletion. To avoid data loss, ask your admin to upgrade.'
            );
        });
    });
});
