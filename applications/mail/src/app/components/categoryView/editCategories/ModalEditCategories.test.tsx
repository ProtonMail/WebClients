import { fireEvent, render, screen } from '@testing-library/react';

import useLoading from '@proton/hooks/useLoading';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { mockActiveCategoriesData, mockCategoriesStore } from '../testUtils/helpers';
import { ModalEditCategories } from './ModalEditCategories';

const mockLocationReplace = jest.fn();

Object.defineProperty(window, 'location', {
    value: {
        replace: mockLocationReplace,
    },
    writable: true,
});

jest.mock('../useCategoriesView', () => ({
    useCategoriesView: jest.fn(() => ({
        categoriesStore: mockCategoriesStore,
        categoriesTabs: mockActiveCategoriesData,
        activeCategoriesTabs: mockActiveCategoriesData,
    })),
}));

jest.mock('@proton/redux-shared-store/sharedProvider', () => ({
    __esModule: true,
    useDispatch: () => jest.fn(),
}));

const mockApi = jest.fn();
jest.mock('@proton/components/hooks/useApi', () => ({
    __esModule: true,
    default: jest.fn(() => mockApi),
}));

jest.mock('@proton/hooks/useLoading');
const mockWithLoading = jest.fn((promise) => promise);
jest.mocked(useLoading).mockReturnValue([false, mockWithLoading, jest.fn()]);

describe('ModalEditCategories', () => {
    const mockOnDisableAll = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('all categories but the default category should be visible in the modal', () => {
        render(<ModalEditCategories onDisableAll={mockOnDisableAll} open={true} />);

        expect(screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_SOCIAL}-display`)).toBeInTheDocument();
        expect(screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS}-display`)).toBeInTheDocument();
        expect(screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_UPDATES}-display`)).toBeInTheDocument();
        expect(screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_FORUMS}-display`)).toBeInTheDocument();
        expect(screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS}-display`)).toBeInTheDocument();
        expect(screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS}-display`)).toBeInTheDocument();

        expect(screen.queryByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_DEFAULT}-display`)).not.toBeInTheDocument();
    });

    it('clicking the checkbox should uncheck it', () => {
        render(<ModalEditCategories onDisableAll={mockOnDisableAll} open={true} />);

        const checkbox = screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_SOCIAL}-display`);
        expect(checkbox).toBeChecked();

        fireEvent.click(checkbox);
        expect(checkbox).not.toBeChecked();
    });

    it('clicking the notify button should change the icon', () => {
        render(<ModalEditCategories onDisableAll={mockOnDisableAll} open={true} />);

        const notifyButton = screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_SOCIAL}-notify`);
        expect(notifyButton).toHaveAttribute('aria-pressed', 'true');

        fireEvent.click(notifyButton);
        expect(notifyButton).toHaveAttribute('aria-pressed', 'false');
    });

    describe('reload behavior', () => {
        it('should reload the page when changing the display of one category', async () => {
            render(<ModalEditCategories onDisableAll={mockOnDisableAll} open={true} />);

            const checkbox = screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_SOCIAL}-display`);

            fireEvent.click(checkbox);
            expect(checkbox).not.toBeChecked();

            const saveButton = screen.getByTestId('save-categories-button');
            fireEvent.click(saveButton);

            // needed for the promise to resolve
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(mockLocationReplace).toHaveBeenCalled();
        });

        it('should not reload the page when changing the notify of one category', async () => {
            render(<ModalEditCategories onDisableAll={mockOnDisableAll} open={true} />);

            const checkbox = screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_SOCIAL}-notify`);
            fireEvent.click(checkbox);

            const saveButton = screen.getByTestId('save-categories-button');
            fireEvent.click(saveButton);

            // needed for the promise to resolve
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(mockLocationReplace).not.toHaveBeenCalled();
        });

        it('should reload when changing the display and notify of one category', async () => {
            render(<ModalEditCategories onDisableAll={mockOnDisableAll} open={true} />);

            const btnDisplay = screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_SOCIAL}-display`);
            const btnNotify = screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_SOCIAL}-notify`);

            fireEvent.click(btnDisplay);
            fireEvent.click(btnNotify);

            const saveButton = screen.getByTestId('save-categories-button');
            fireEvent.click(saveButton);

            // needed for the promise to resolve
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(mockLocationReplace).toHaveBeenCalled();
        });

        it('should not reload when changing the notify of two categories', async () => {
            render(<ModalEditCategories onDisableAll={mockOnDisableAll} open={true} />);

            const btnNotify1 = screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_SOCIAL}-notify`);
            const btnNotify2 = screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS}-notify`);

            fireEvent.click(btnNotify1);
            fireEvent.click(btnNotify2);

            const saveButton = screen.getByTestId('save-categories-button');
            fireEvent.click(saveButton);

            // needed for the promise to resolve
            await new Promise((resolve) => setTimeout(resolve, 0));
            expect(mockLocationReplace).not.toHaveBeenCalled();
        });
    });

    describe('API tests', () => {
        it('the API should be called 2 times if 2 different categories are modified', () => {
            render(<ModalEditCategories onDisableAll={mockOnDisableAll} open={true} />);

            const checkbox1 = screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_SOCIAL}-display`);
            const checkbox2 = screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS}-display`);

            fireEvent.click(checkbox1);
            fireEvent.click(checkbox2);

            fireEvent.click(screen.getByTestId('save-categories-button'));
            expect(mockApi).toHaveBeenCalledTimes(2);
        });

        it('should call API once if we update then notify and display of the same category', () => {
            render(<ModalEditCategories onDisableAll={mockOnDisableAll} open={true} />);

            const displayBtn = screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_SOCIAL}-display`);
            const notifyBtn = screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_SOCIAL}-notify`);

            fireEvent.click(displayBtn);
            fireEvent.click(notifyBtn);

            fireEvent.click(screen.getByTestId('save-categories-button'));

            expect(mockApi).toHaveBeenCalledTimes(1);
        });

        it('should call the onDisableAll function when the disable all button is clicked', () => {
            render(<ModalEditCategories onDisableAll={mockOnDisableAll} open={true} />);

            fireEvent.click(screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_SOCIAL}-display`));
            fireEvent.click(screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS}-display`));
            fireEvent.click(screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_UPDATES}-display`));
            fireEvent.click(screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_FORUMS}-display`));
            fireEvent.click(screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS}-display`));
            fireEvent.click(screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS}-display`));

            fireEvent.click(screen.getByTestId('save-categories-button'));

            expect(mockOnDisableAll).toHaveBeenCalledTimes(1);
        });
    });
});
