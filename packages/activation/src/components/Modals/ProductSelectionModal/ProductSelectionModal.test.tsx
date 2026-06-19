import { fireEvent, screen, waitFor } from '@testing-library/dom';

import { getModelState } from '@proton/account/test';
import { EASY_SWITCH_SOURCES, ImportProvider, ImportType } from '@proton/activation/src/interface';
import { useDriveSdk } from '@proton/activation/src/logic/driveContext';
import { easySwitchRender } from '@proton/activation/src/tests/render';
import { useWriteableCalendars } from '@proton/calendar/calendars/hooks';
import { ADDRESS_FLAGS } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash/useFlag';

import { ProductSelectionModal } from './ProductSelectionModal';

const mockHandleSubmit = jest.fn();

jest.mock('@proton/unleash/useFlag', () => ({
    __esModule: true,
    useFlag: jest.fn(),
}));

jest.mock('@proton/activation/src/logic/driveContext', () => ({
    ...jest.requireActual('@proton/activation/src/logic/driveContext'),
    useDriveSdk: jest.fn(),
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

// Stub the claim-address modal - it pulls auth/telemetry/silent-api deps we don't need here;
// we only assert that the product modal opens it.
jest.mock('@proton/activation/src/components/Modals/BYOEClaimProtonAddressModal/BYOEClaimProtonAddressModal', () => ({
    __esModule: true,
    default: () => <div data-testid="byoeClaimProtonAddressModal" />,
}));

const mockedUseFlag = useFlag as jest.Mock;
const mockedUseWriteableCalendars = useWriteableCalendars as jest.Mock;
const mockedUseDriveSdk = useDriveSdk as jest.Mock;

const setDriveFlag = (enabled: boolean) =>
    mockedUseFlag.mockImplementation((flag: string) => (flag === 'EasySwitchB2CForDriveWeb' ? enabled : false));

// Drive is only offered once the host app has initialized the Drive SDK.
// The modal reads the client via useDriveSdk().
const setDriveInitialized = (initialized: boolean) => mockedUseDriveSdk.mockReturnValue(initialized ? {} : undefined);

// The modal only cares whether at least one writeable calendar exists (length > 0).
const setHasWriteableCalendar = (hasCalendar: boolean) =>
    mockedUseWriteableCalendars.mockReturnValue([hasCalendar ? [{}] : [], false]);

// handleSubmit is called as (provider, products, source) by the Continue button.
const getSubmittedProducts = (): ImportType[] => mockHandleSubmit.mock.calls[0][1];

interface RenderOptions {
    onClose?: () => void;
    onComplete?: () => Promise<void>;
    preloadedState?: Record<string, unknown>;
}

const renderModal = (provider: ImportProvider, options?: RenderOptions) =>
    easySwitchRender(
        <ProductSelectionModal
            open
            provider={provider}
            source={EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS}
            onClose={options?.onClose ?? (() => {})}
            onComplete={options?.onComplete}
        />,
        options?.preloadedState
    );

beforeEach(() => {
    setDriveFlag(false);
    setDriveInitialized(true);
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

    it('submits the selected provider and source, then runs onComplete', async () => {
        const onComplete = jest.fn().mockResolvedValue(undefined);
        renderModal(ImportProvider.GOOGLE, { onComplete });

        fireEvent.click(screen.getByText('Continue'));

        expect(mockHandleSubmit).toHaveBeenCalledWith(
            ImportProvider.GOOGLE,
            expect.any(Array),
            EASY_SWITCH_SOURCES.ACCOUNT_WEB_SETTINGS
        );
        await waitFor(() => expect(onComplete).toHaveBeenCalled());
    });

    it('calls onClose without submitting when Cancel is clicked', () => {
        const onClose = jest.fn();
        renderModal(ImportProvider.GOOGLE, { onClose });

        fireEvent.click(screen.getByText('Cancel'));

        expect(onClose).toHaveBeenCalled();
        expect(mockHandleSubmit).not.toHaveBeenCalled();
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

    it('hides Drive when the Drive SDK is not initialized, even with the flag on and Google', () => {
        setDriveFlag(true);
        setDriveInitialized(false);
        renderModal(ImportProvider.GOOGLE);

        expect(screen.queryByTestId('productCheckbox:Drive')).not.toBeInTheDocument();
        expect(screen.getByTestId('productCheckbox:Mail')).toBeInTheDocument();

        // Drive must not be silently selected when its checkbox is hidden
        fireEvent.click(screen.getByText('Continue'));
        expect(getSubmittedProducts()).not.toContain(ImportType.DRIVE);
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

describe('ProductSelectionModal - BYOE account', () => {
    const byoeAddress = {
        ID: 'address-byoe',
        Email: 'byoe@gmail.com',
        Flags: ADDRESS_FLAGS.BYOE,
    } as Address;

    const byoeState = { addresses: getModelState([byoeAddress]) };

    it('keeps Calendar disabled even when a writeable calendar exists', () => {
        // A writeable calendar exists, but a BYOE-only account still cannot import to Calendar.
        setHasWriteableCalendar(true);
        renderModal(ImportProvider.GOOGLE, { preloadedState: byoeState });

        const calendarCheckbox = screen.getByTestId('productCheckbox:Calendar');
        expect(calendarCheckbox).toBeDisabled();
        expect(calendarCheckbox).not.toBeChecked();

        fireEvent.click(screen.getByText('Continue'));
        expect(getSubmittedProducts()).not.toContain(ImportType.CALENDAR);
    });

    it('offers a claim-Proton-address CTA that opens the claim modal', () => {
        renderModal(ImportProvider.GOOGLE, { preloadedState: byoeState });

        const claimCta = screen.getByText(/Get a free .* address/);
        expect(screen.queryByTestId('byoeClaimProtonAddressModal')).not.toBeInTheDocument();

        fireEvent.click(claimCta);
        expect(screen.getByTestId('byoeClaimProtonAddressModal')).toBeInTheDocument();
    });
});
