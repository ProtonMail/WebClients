import { fireEvent, screen } from '@testing-library/dom';

import { EASY_SWITCH_SOURCES, ImportProvider, ImportType } from '@proton/activation/src/interface';
import { easySwitchRender } from '@proton/activation/src/tests/render';
import { useWriteableCalendars } from '@proton/calendar/calendars/hooks';
import { useFlag } from '@proton/unleash/useFlag';

import { ProductSelectionModal } from './ProductSelectionModal';

const mockHandleSubmit = jest.fn();

jest.mock('@proton/unleash/useFlag', () => ({
    __esModule: true,
    useFlag: jest.fn(),
}));

// Avoid the submit hook's OAuth/config dependencies - not needed to render the product list.
jest.mock('@proton/activation/src/components/Modals/ProductSelectionModal/useProductSelectionSubmit', () => ({
    __esModule: true,
    useProductSelectionSubmit: () => ({ handleSubmit: mockHandleSubmit, loadingConfig: false }),
}));

jest.mock('@proton/calendar/calendars/hooks', () => ({
    ...jest.requireActual('@proton/calendar/calendars/hooks'),
    useWriteableCalendars: jest.fn(),
}));

const mockedUseFlag = useFlag as jest.Mock;
const mockedUseWriteableCalendars = useWriteableCalendars as jest.Mock;

const setDriveFlag = (enabled: boolean) =>
    mockedUseFlag.mockImplementation((flag: string) => (flag === 'EasySwitchB2CForDriveWeb' ? enabled : false));

// The modal only cares whether at least one writeable calendar exists (length > 0).
const setHasWriteableCalendar = (hasCalendar: boolean) =>
    mockedUseWriteableCalendars.mockReturnValue([hasCalendar ? [{}] : [], false]);

// handleSubmit is called as (provider, products, source) by the Continue button.
const getSubmittedProducts = (): ImportType[] => mockHandleSubmit.mock.calls[0][1];

const renderModal = (provider: ImportProvider) =>
    easySwitchRender(
        <ProductSelectionModal
            open
            provider={provider}
            source={EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS}
            onClose={() => {}}
        />
    );

beforeEach(() => {
    setDriveFlag(false);
    setHasWriteableCalendar(false);
});

afterEach(() => {
    jest.clearAllMocks();
});

describe('ProductSelectionModal - product selection', () => {
    it('Google pre-selects Mail and Contacts and submits them', () => {
        renderModal(ImportProvider.GOOGLE);

        expect(screen.getByTestId('productCheckbox:Mail')).toBeChecked();
        expect(screen.getByTestId('productCheckbox:Contacts')).toBeChecked();

        fireEvent.click(screen.getByText('Continue'));
        const products = getSubmittedProducts();
        expect(products).toContain(ImportType.MAIL);
        expect(products).toContain(ImportType.CONTACTS);
    });

    it('disables and unselects Calendar when there is no writeable calendar', () => {
        setHasWriteableCalendar(false);
        renderModal(ImportProvider.GOOGLE);

        const calendarCheckbox = screen.getByTestId('productCheckbox:Calendar');
        expect(calendarCheckbox).toBeDisabled();
        expect(calendarCheckbox).not.toBeChecked();

        fireEvent.click(screen.getByText('Continue'));
        expect(getSubmittedProducts()).not.toContain(ImportType.CALENDAR);
    });

    it('pre-selects Calendar when a writeable calendar exists', () => {
        setHasWriteableCalendar(true);
        renderModal(ImportProvider.GOOGLE);

        const calendarCheckbox = screen.getByTestId('productCheckbox:Calendar');
        expect(calendarCheckbox).toBeEnabled();
        expect(calendarCheckbox).toBeChecked();

        fireEvent.click(screen.getByText('Continue'));
        expect(getSubmittedProducts()).toContain(ImportType.CALENDAR);
    });

    it('unchecking a product removes it from the submission', () => {
        renderModal(ImportProvider.GOOGLE);

        // Uncheck Contacts (pre-selected by default)
        fireEvent.click(screen.getByTestId('productCheckbox:Contacts'));

        fireEvent.click(screen.getByText('Continue'));
        const products = getSubmittedProducts();
        expect(products).not.toContain(ImportType.CONTACTS);
        expect(products).toContain(ImportType.MAIL);
    });

    it('renders single-select radios defaulting to Mail for Yahoo', () => {
        renderModal(ImportProvider.YAHOO);

        // Radio UI, not the checkbox UI
        expect(screen.getByTestId(`productRadio:${ImportType.MAIL}`)).toBeInTheDocument();
        expect(screen.queryByTestId('productCheckbox:Mail')).not.toBeInTheDocument();

        fireEvent.click(screen.getByText('Continue'));
        expect(getSubmittedProducts()).toEqual([ImportType.MAIL]);
    });

    it('switches from the checkbox UI to the radio UI when changing provider to Yahoo', () => {
        renderModal(ImportProvider.GOOGLE);
        expect(screen.getByTestId('productCheckbox:Mail')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('productSelectionModal:selectProvider'));
        fireEvent.click(screen.getByTestId(`productSelectionModal:${ImportProvider.YAHOO}`));

        expect(screen.queryByTestId('productCheckbox:Mail')).not.toBeInTheDocument();
        expect(screen.getByTestId(`productRadio:${ImportType.MAIL}`)).toBeInTheDocument();

        fireEvent.click(screen.getByText('Continue'));
        expect(getSubmittedProducts()).toEqual([ImportType.MAIL]);
    });
});

describe('ProductSelectionModal - Drive option', () => {
    it('shows Drive, pre-selected, when the flag is on and the provider is Google', () => {
        setDriveFlag(true);
        renderModal(ImportProvider.GOOGLE);

        const driveCheckbox = screen.getByTestId('productCheckbox:Drive');
        expect(driveCheckbox).toBeInTheDocument();
        expect(driveCheckbox).toBeChecked();

        // Drive is actually part of the submitted selection
        fireEvent.click(screen.getByText('Continue'));
        expect(getSubmittedProducts()).toContain(ImportType.DRIVE);
    });

    it('hides Drive when the flag is off, even for Google', () => {
        setDriveFlag(false);
        renderModal(ImportProvider.GOOGLE);

        expect(screen.queryByTestId('productCheckbox:Drive')).not.toBeInTheDocument();
        // The Google product block still renders the other products.
        expect(screen.getByTestId('productCheckbox:Mail')).toBeInTheDocument();
    });

    it('hides Drive for Outlook even when the flag is on (Drive is Google-only)', () => {
        setDriveFlag(true);
        renderModal(ImportProvider.OUTLOOK);

        expect(screen.queryByTestId('productCheckbox:Drive')).not.toBeInTheDocument();
        expect(screen.getByTestId('productCheckbox:Mail')).toBeInTheDocument();

        // Drive must not be silently selected when its checkbox is hidden
        fireEvent.click(screen.getByText('Continue'));
        expect(getSubmittedProducts()).not.toContain(ImportType.DRIVE);
    });

    it('removes Drive when the selected provider is switched away from Google', () => {
        setDriveFlag(true);
        renderModal(ImportProvider.GOOGLE);

        expect(screen.getByTestId('productCheckbox:Drive')).toBeInTheDocument();

        // Switch the provider dropdown to Outlook
        fireEvent.click(screen.getByTestId('productSelectionModal:selectProvider'));
        fireEvent.click(screen.getByTestId(`productSelectionModal:${ImportProvider.OUTLOOK}`));

        // Drive is gated on the live selection, so it disappears under Outlook
        expect(screen.queryByTestId('productCheckbox:Drive')).not.toBeInTheDocument();
        expect(screen.getByTestId('productCheckbox:Mail')).toBeInTheDocument();
    });
});
