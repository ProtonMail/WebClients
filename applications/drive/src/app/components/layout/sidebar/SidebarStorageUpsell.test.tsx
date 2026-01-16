import { render, screen } from '@testing-library/react';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useLocalState from '@proton/components/hooks/useLocalState';
import { APPS, PRODUCT_BIT } from '@proton/shared/lib/constants';
import {
    SpaceState,
    getAppSpace,
    getCanAddStorage,
    getCompleteSpaceDetails,
    getSpace,
} from '@proton/shared/lib/user/storage';

import { useSuggestBusinessModal } from '../../../modals/SuggestBusinessModal/useSuggestBusinessModal';
import SidebarStorageUpsell from './SidebarStorageUpsell';

jest.mock('@proton/account/user/hooks');
const mockedUseUser = jest.mocked(useUser);

jest.mock('@proton/account/subscription/hooks');
const mockedUseSubscription = jest.mocked(useSubscription);

jest.mock('@proton/components/hooks/useLocalState');
const mockedUseLocalState = jest.mocked(useLocalState);

jest.mock('@proton/shared/lib/user/storage');
const mockedGetCanAddStorage = jest.mocked(getCanAddStorage);
const mockedGetSpace = jest.mocked(getSpace);
const mockedGetAppSpace = jest.mocked(getAppSpace);
const mockedGetCompleteSpaceDetails = jest.mocked(getCompleteSpaceDetails);

jest.mock('../../../modals/SuggestBusinessModal/useSuggestBusinessModal');
const mockedUseSuggestBusinessModal = jest.mocked(useSuggestBusinessModal);

jest.mock('./SettingsLink', () => {
    const React = require('react');
    return {
        __esModule: true,
        // eslint-disable-next-line react/display-name
        default: React.forwardRef(({ children, ...props }: any, ref: any) => (
            <a ref={ref} {...props}>
                {children}
            </a>
        )),
    };
});

describe('SidebarStorageUpsell', () => {
    const mockShowModal = jest.fn();
    const mockModal = <div data-testid="suggest-business-modal">Modal</div>;
    const mockStorageRef = { current: null };

    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseSuggestBusinessModal.mockReturnValue([mockModal, mockShowModal]);
        mockedUseLocalState.mockReturnValue([false, jest.fn()]);
        mockedUseSubscription.mockReturnValue([{} as any, false]);
        mockedGetSpace.mockReturnValue({ splitStorage: true } as ReturnType<typeof getSpace>);
    });

    const mockUser = (subscribed: number, isPaid: boolean = subscribed !== 0) => {
        mockedUseUser.mockReturnValue([{ ID: 'test-user', Subscribed: subscribed, isPaid } as any, false]);
    };

    const mockDate = (day: number) => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2025, 0, day)); // January 2025
    };

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('suggestBusinessButton visibility', () => {
        describe('when all conditions are met', () => {
            beforeEach(() => {
                mockUser(0); // Free user
                mockDate(15); // Day within 15-22 range
                mockedGetCanAddStorage.mockReturnValue(true);
                mockedGetAppSpace.mockReturnValue({ usedSpace: 40, maxSpace: 100 }); // 40% usage
            });

            it('should render suggestBusinessButton for free user in Proton Drive', () => {
                render(<SidebarStorageUpsell app={APPS.PROTONDRIVE} storageRef={mockStorageRef} />);
                expect(screen.getByText('Get Drive for Business')).toBeInTheDocument();
            });

            it('should not render suggestBusinessButton for Drive plan subscriber in Proton Drive', () => {
                mockUser(PRODUCT_BIT.DRIVE);
                render(<SidebarStorageUpsell app={APPS.PROTONDRIVE} storageRef={mockStorageRef} />);
                expect(screen.queryByText('Get Drive for Business')).not.toBeInTheDocument();
            });

            it('should render the modal element', () => {
                render(<SidebarStorageUpsell app={APPS.PROTONDRIVE} storageRef={mockStorageRef} />);
                expect(screen.getByTestId('suggest-business-modal')).toBeInTheDocument();
            });
        });

        describe('when user cannot add storage', () => {
            it('should not render anything when getCanAddStorage returns false', () => {
                mockUser(0);
                mockDate(15);
                mockedGetCanAddStorage.mockReturnValue(false);
                mockedGetAppSpace.mockReturnValue({ usedSpace: 40, maxSpace: 100 });

                const { container } = render(
                    <SidebarStorageUpsell app={APPS.PROTONDRIVE} storageRef={mockStorageRef} />
                );
                expect(container).toBeEmptyDOMElement();
            });
        });

        describe('when app is not Proton Drive', () => {
            it('should not render suggestBusinessButton for Mail app', () => {
                mockUser(0);
                mockDate(15);
                mockedGetCanAddStorage.mockReturnValue(true);
                mockedGetAppSpace.mockReturnValue({ usedSpace: 40, maxSpace: 100 });
                // Mock getCompleteSpaceDetails to return a valid structure for non-Drive apps
                mockedGetCompleteSpaceDetails.mockReturnValue({
                    drive: { type: SpaceState.Good, displayed: 40, percentage: 40 },
                    base: { type: SpaceState.Good, displayed: 40, percentage: 40 },
                    pooled: { type: SpaceState.Good, displayed: 40, percentage: 40 },
                });

                render(<SidebarStorageUpsell app={APPS.PROTONMAIL} storageRef={mockStorageRef} />);
                // Should not show business button for non-Drive apps (returns null when no upsell)
                expect(screen.queryByText('Get Drive for Business')).not.toBeInTheDocument();
            });
        });

        describe('when user has other subscription', () => {
            it('should not render suggestBusinessButton when user has Mail subscription', () => {
                mockUser(PRODUCT_BIT.MAIL); // Mail subscriber
                mockDate(15);
                mockedGetCanAddStorage.mockReturnValue(true);
                mockedGetAppSpace.mockReturnValue({ usedSpace: 40, maxSpace: 100 });

                render(<SidebarStorageUpsell app={APPS.PROTONDRIVE} storageRef={mockStorageRef} />);
                expect(screen.queryByText('Get Drive for Business')).not.toBeInTheDocument();
            });

            it('should not render suggestBusinessButton when user has VPN subscription', () => {
                mockUser(PRODUCT_BIT.VPN);
                mockDate(15);
                mockedGetCanAddStorage.mockReturnValue(true);
                mockedGetAppSpace.mockReturnValue({ usedSpace: 40, maxSpace: 100 });

                render(<SidebarStorageUpsell app={APPS.PROTONDRIVE} storageRef={mockStorageRef} />);
                expect(screen.queryByText('Get Drive for Business')).not.toBeInTheDocument();
            });
        });

        describe('when used space ratio is >= 50%', () => {
            beforeEach(() => {
                mockUser(0);
                mockDate(15);
                mockedGetCanAddStorage.mockReturnValue(true);
            });

            it('should render upsellButton instead when ratio is exactly 50%', () => {
                mockedGetAppSpace.mockReturnValue({ usedSpace: 50, maxSpace: 100 });
                render(<SidebarStorageUpsell app={APPS.PROTONDRIVE} storageRef={mockStorageRef} />);
                expect(screen.queryByText('Get Drive for Business')).not.toBeInTheDocument();
                expect(screen.getByText('Get more storage')).toBeInTheDocument();
            });

            it('should render upsellButton instead when ratio is above 50%', () => {
                mockedGetAppSpace.mockReturnValue({ usedSpace: 75, maxSpace: 100 });
                render(<SidebarStorageUpsell app={APPS.PROTONDRIVE} storageRef={mockStorageRef} />);
                expect(screen.queryByText('Get Drive for Business')).not.toBeInTheDocument();
                expect(screen.getByText('Get more storage')).toBeInTheDocument();
            });
        });

        describe('when user is a paid user', () => {
            beforeEach(() => {
                mockUser(0);
                mockDate(15);
                mockedGetCanAddStorage.mockReturnValue(true);
            });

            it('should render upsellButton instead for free user', () => {
                mockedGetAppSpace.mockReturnValue({ usedSpace: 50, maxSpace: 100 });
                render(<SidebarStorageUpsell app={APPS.PROTONDRIVE} storageRef={mockStorageRef} />);
                expect(screen.queryByText('Get Drive for Business')).not.toBeInTheDocument();
                expect(screen.getByText('Get more storage')).toBeInTheDocument();
            });

            it('should render upsellButton instead when ratio is above 50%', () => {
                mockedGetAppSpace.mockReturnValue({ usedSpace: 75, maxSpace: 100 });
                render(<SidebarStorageUpsell app={APPS.PROTONDRIVE} storageRef={mockStorageRef} />);
                expect(screen.queryByText('Get Drive for Business')).not.toBeInTheDocument();
                expect(screen.getByText('Get more storage')).toBeInTheDocument();
            });
        });

        describe('when day of month is outside 15-22 range', () => {
            beforeEach(() => {
                mockUser(0);
                mockedGetCanAddStorage.mockReturnValue(true);
                mockedGetAppSpace.mockReturnValue({ usedSpace: 40, maxSpace: 100 });
            });

            it('should render upsellButton instead when day is before 15', () => {
                mockDate(14);
                render(<SidebarStorageUpsell app={APPS.PROTONDRIVE} storageRef={mockStorageRef} />);
                expect(screen.queryByText('Get Drive for Business')).not.toBeInTheDocument();
                expect(screen.getByText('Get more storage')).toBeInTheDocument();
            });

            it('should render upsellButton instead when day is after 22', () => {
                mockDate(23);
                render(<SidebarStorageUpsell app={APPS.PROTONDRIVE} storageRef={mockStorageRef} />);
                expect(screen.queryByText('Get Drive for Business')).not.toBeInTheDocument();
                expect(screen.getByText('Get more storage')).toBeInTheDocument();
            });

            it('should render upsellButton on day 1', () => {
                mockDate(1);
                render(<SidebarStorageUpsell app={APPS.PROTONDRIVE} storageRef={mockStorageRef} />);
                expect(screen.queryByText('Get Drive for Business')).not.toBeInTheDocument();
                expect(screen.getByText('Get more storage')).toBeInTheDocument();
            });
        });

        describe('boundary conditions', () => {
            beforeEach(() => {
                mockUser(0);
                mockedGetCanAddStorage.mockReturnValue(true);
                mockedGetAppSpace.mockReturnValue({ usedSpace: 40, maxSpace: 100 });
            });

            it('should render suggestBusinessButton on day 15', () => {
                mockDate(15);
                render(<SidebarStorageUpsell app={APPS.PROTONDRIVE} storageRef={mockStorageRef} />);
                expect(screen.getByText('Get Drive for Business')).toBeInTheDocument();
            });

            it('should render suggestBusinessButton on day 22', () => {
                mockDate(22);
                render(<SidebarStorageUpsell app={APPS.PROTONDRIVE} storageRef={mockStorageRef} />);
                expect(screen.getByText('Get Drive for Business')).toBeInTheDocument();
            });

            it('should render suggestBusinessButton when used space is just under 50%', () => {
                mockDate(15);
                mockedGetAppSpace.mockReturnValue({ usedSpace: 49, maxSpace: 100 });
                render(<SidebarStorageUpsell app={APPS.PROTONDRIVE} storageRef={mockStorageRef} />);
                expect(screen.getByText('Get Drive for Business')).toBeInTheDocument();
            });

            it('should render suggestBusinessButton when used space is 0%', () => {
                mockDate(15);
                mockedGetAppSpace.mockReturnValue({ usedSpace: 0, maxSpace: 100 });
                render(<SidebarStorageUpsell app={APPS.PROTONDRIVE} storageRef={mockStorageRef} />);
                expect(screen.getByText('Get Drive for Business')).toBeInTheDocument();
            });
        });
    });
});
