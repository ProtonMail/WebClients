import { fireEvent, render, screen } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { getAppSpace, getSpace } from '@proton/shared/lib/user/storage';

import { useSuggestBusinessModal } from '../../../modals/SuggestBusinessModal/useSuggestBusinessModal';
import { SuggestBusinessButton } from './SuggestBusinessButton';

jest.mock('@proton/account/user/hooks');
const mockedUseUser = jest.mocked(useUser);

jest.mock('@proton/shared/lib/user/storage');
const mockedGetSpace = jest.mocked(getSpace);
const mockedGetAppSpace = jest.mocked(getAppSpace);

jest.mock('../../../modals/SuggestBusinessModal/useSuggestBusinessModal');
const mockedUseSuggestBusinessModal = jest.mocked(useSuggestBusinessModal);

describe('SuggestBusinessButton', () => {
    const mockShowModal = jest.fn();
    const mockModal = <div data-testid="suggest-business-modal">Modal</div>;

    beforeEach(() => {
        jest.clearAllMocks();
        mockedUseSuggestBusinessModal.mockReturnValue([mockModal, mockShowModal]);
        mockedGetSpace.mockReturnValue({ usedSpace: 100, maxSpace: 1000 } as ReturnType<typeof getSpace>);
        mockedGetAppSpace.mockReturnValue({ usedSpace: 100, maxSpace: 1000 });
    });

    const mockUser = (isPaid: boolean) => {
        mockedUseUser.mockReturnValue([{ isPaid } as any, false]);
    };

    const mockDate = (day: number) => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date(2025, 0, day)); // January 2025
    };

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('when all conditions are met', () => {
        beforeEach(() => {
            mockUser(false);
            mockDate(15); // Day within 15-22 range
            mockedGetAppSpace.mockReturnValue({ usedSpace: 40, maxSpace: 100 }); // 40% usage
        });

        it('should render the button', () => {
            render(<SuggestBusinessButton />);
            expect(screen.getByRole('button')).toBeInTheDocument();
            expect(screen.getByText('Get Drive for Business')).toBeInTheDocument();
        });

        it('should show modal when button is clicked', () => {
            render(<SuggestBusinessButton />);
            fireEvent.click(screen.getByRole('button'));
            expect(mockShowModal).toHaveBeenCalledWith({});
        });

        it('should render the modal element', () => {
            render(<SuggestBusinessButton />);
            expect(screen.getByTestId('suggest-business-modal')).toBeInTheDocument();
        });
    });

    describe('when user is paid', () => {
        it('should not render the button', () => {
            mockUser(true);
            mockDate(15);
            mockedGetAppSpace.mockReturnValue({ usedSpace: 40, maxSpace: 100 });

            const { container } = render(<SuggestBusinessButton />);
            expect(container).toBeEmptyDOMElement();
        });
    });

    describe('when used space ratio is >= 50%', () => {
        it('should not render the button when ratio is exactly 50%', () => {
            mockUser(false);
            mockDate(15);
            mockedGetAppSpace.mockReturnValue({ usedSpace: 50, maxSpace: 100 });

            const { container } = render(<SuggestBusinessButton />);
            expect(container).toBeEmptyDOMElement();
        });

        it('should not render the button when ratio is above 50%', () => {
            mockUser(false);
            mockDate(15);
            mockedGetAppSpace.mockReturnValue({ usedSpace: 75, maxSpace: 100 });

            const { container } = render(<SuggestBusinessButton />);
            expect(container).toBeEmptyDOMElement();
        });
    });

    describe('when day of month is outside 15-22 range', () => {
        it('should not render the button when day is before 15', () => {
            mockUser(false);
            mockDate(14);
            mockedGetAppSpace.mockReturnValue({ usedSpace: 40, maxSpace: 100 });

            const { container } = render(<SuggestBusinessButton />);
            expect(container).toBeEmptyDOMElement();
        });

        it('should not render the button when day is after 22', () => {
            mockUser(false);
            mockDate(23);
            mockedGetAppSpace.mockReturnValue({ usedSpace: 40, maxSpace: 100 });

            const { container } = render(<SuggestBusinessButton />);
            expect(container).toBeEmptyDOMElement();
        });
    });

    describe('boundary conditions', () => {
        beforeEach(() => {
            mockUser(false);
            mockedGetAppSpace.mockReturnValue({ usedSpace: 40, maxSpace: 100 });
        });

        it('should render the button on day 15', () => {
            mockDate(15);
            render(<SuggestBusinessButton />);
            expect(screen.getByRole('button')).toBeInTheDocument();
        });

        it('should render the button on day 22', () => {
            mockDate(22);
            render(<SuggestBusinessButton />);
            expect(screen.getByRole('button')).toBeInTheDocument();
        });

        it('should render the button when used space is just under 50%', () => {
            mockDate(15);
            mockedGetAppSpace.mockReturnValue({ usedSpace: 49, maxSpace: 100 });
            render(<SuggestBusinessButton />);
            expect(screen.getByRole('button')).toBeInTheDocument();
        });
    });
});
