import { fireEvent, screen, waitFor } from '@testing-library/dom';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useUser } from '@proton/account/user/hooks';
import { headers } from '@proton/activation/msw.header';
import useBYOEAddressesCounts from '@proton/activation/src/hooks/useBYOEAddressesCounts';
import useBYOEFeatureStatus from '@proton/activation/src/hooks/useBYOEFeatureStatus';
import { ImportProvider, ImportType } from '@proton/activation/src/interface';
import { easySwitchRender } from '@proton/activation/src/tests/render';
import { useWriteableCalendars } from '@proton/calendar/calendars/hooks';
import { ADDRESS_FLAGS, APPS, BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import ProviderCard from './ProviderCard';

const defaultUseUser = [
    {
        isAdmin: true,
        isFree: true,
        isMember: true,
        isPaid: true,
        isPrivate: true,
        isSelf: true,
        isDelinquent: true,
        hasPaidMail: true,
        hasPaidVpn: true,
        canPay: true,
        accessType: 0,
    },
    false,
];

const calendars = [
    {
        ID: 'calendarId',
        Name: 'testing@proton.ch',
        Description: '',
        Type: 0,
        Owner: {
            Email: 'testing@proton.ch',
        },
        Flags: 1,
        Members: [
            {
                ID: 'memberId',
                Permissions: 127,
                Email: 'testing@proton.ch',
                AddressID: 'addressID',
                CalendarID: 'calendarId',
                Name: 'testing@proton.ch',
                Description: '',
                Color: '#273EB2',
                Display: 1,
                Flags: 1,
            },
        ],
        Color: '#273EB2',
        Display: 1,
        Email: 'testing@proton.ch',
        Permissions: 127,
    },
];

jest.mock('@proton/mail/store/importerConfig/hooks', () => ({
    useApiEnvironmentConfig: () => [
        {
            'oauth.google.client_id': 'string',
            'oauth.outlook.client_id': 'string',
            'oauth.zoom.client_id': 'string',
        },
        false,
    ],
}));

jest.mock('@proton/activation/src/hooks/useBYOEAddressesCounts');
const mockUseBYOEAddressesCounts = useBYOEAddressesCounts as jest.MockedFunction<typeof useBYOEAddressesCounts>;

jest.mock('@proton/account/user/hooks');
const mockUseUser = useUser as jest.MockedFunction<any>;

jest.mock('@proton/calendar/calendars/hooks', () => {});
jest.mock('@proton/calendar/calendarUserSettings/hooks', () => ({
    useCalendarUserSettings: () => [],
    useGetCalendarUserSettings: () => () => [],
}));
jest.mock('@proton/components/containers/eventManager/calendar/CalendarModelEventManagerProvider', () => ({
    useCalendarModelEventManager: jest.fn(() => ({
        subscribe: jest.fn(),
    })),
}));
jest.mock('@proton/calendar/calendars/hooks', () => ({
    useCalendars: jest.fn().mockReturnValue([calendars, false]),
    useWriteableCalendars: jest.fn().mockReturnValue([calendars, false]),
    useGetCalendars: jest.fn(),
}));

const server = setupServer(
    http.get('/core/v4/features', () => {
        return HttpResponse.json({}, { headers });
    }),
    http.get('/importer/v1/mail/importers/authinfo', () => {
        return HttpResponse.json({}, { headers });
    }),
    http.get('/core/v4/system/config', () => {
        return HttpResponse.json({}, { headers });
    }),
    http.get('/calendar/v1', () => {
        return HttpResponse.json({}, { headers });
    })
);

jest.mock('@proton/account/addresses/hooks');
const mockUseAddresses = useAddresses as jest.MockedFunction<any>;

jest.mock('@proton/activation/src/hooks/useBYOEFeatureStatus');
const mockUseBYOEFeatureStatus = useBYOEFeatureStatus as jest.MockedFunction<typeof useBYOEFeatureStatus>;

beforeEach(() => {
    mockUseBYOEFeatureStatus.mockReturnValue(false);
    mockUseAddresses.mockReturnValue([[], false]);
});

beforeAll(() => {
    server.listen();
});
afterEach(() => {
    server.resetHandlers();
});
afterAll(() => {
    server.close();
});

describe('Provider cards process testing', () => {
    beforeEach(() => {
        mockUseBYOEAddressesCounts.mockReturnValue({
            isLoadingAddressesCount: false,
            byoeAddresses: [],
            activeBYOEAddresses: [],
            addressesOrSyncs: [],
            forwardingList: [],
            byoeAddressesAvailableCount: 3,
            maxBYOEAddresses: 3,
        });
    });

    it('Should display the four cards on the page without user data', async () => {
        mockUseUser.mockReturnValue(defaultUseUser);
        easySwitchRender(<ProviderCard app={APPS.PROTONMAIL} />);

        const google = screen.getByTestId('ProviderButton:googleCardForward');
        const yahoo = screen.getByTestId('ProviderButton:yahooCard');
        const outlook = screen.getByTestId('ProviderButton:outlookCard');
        const advancedImport = screen.getByTestId('ProviderButton:advancedImport');

        expect(google).toBeEnabled();
        expect(yahoo).toBeEnabled();
        expect(outlook).toBeEnabled();
        expect(advancedImport).toBeEnabled();
    });

    it('Should open the advanced import modal', async () => {
        mockUseUser.mockReturnValue(defaultUseUser);
        easySwitchRender(<ProviderCard app={APPS.PROTONMAIL} />);

        const advancedImport = screen.getByTestId('ProviderButton:advancedImport');
        expect(advancedImport).toBeEnabled();

        // Open advanced import modal
        fireEvent.click(advancedImport);
        await waitFor(() => screen.getByText(`Import your data to ${BRAND_NAME}`));

        // Select Provider is google by default
        screen.getAllByTestId(`productSelectionModal:${ImportProvider.GOOGLE}`);

        // 3 checkboxes are displayed, and all options are checked
        expect(screen.getByTestId(`productCheckbox:${ImportType.MAIL}`)).toBeChecked();
        expect(screen.getByTestId(`productCheckbox:${ImportType.CALENDAR}`)).toBeChecked();
        expect(screen.getByTestId(`productCheckbox:${ImportType.CONTACTS}`)).toBeChecked();
    });

    it('Should open the Outlook modal', async () => {
        mockUseUser.mockReturnValue(defaultUseUser);
        easySwitchRender(<ProviderCard app={APPS.PROTONMAIL} />);

        const outlookImport = screen.getByTestId('ProviderButton:outlookCard');
        expect(outlookImport).toBeEnabled();

        // Open Outlook import modal
        fireEvent.click(outlookImport);
        await waitFor(() => screen.getByText(`Import your data to ${BRAND_NAME}`));

        // Select Provider is Outlook
        screen.getAllByTestId(`productSelectionModal:${ImportProvider.OUTLOOK}`);

        // 3 checkboxes are displayed, and all options are checked
        expect(screen.getByTestId(`productCheckbox:${ImportType.MAIL}`)).toBeChecked();
        expect(screen.getByTestId(`productCheckbox:${ImportType.CALENDAR}`)).toBeChecked();
        expect(screen.getByTestId(`productCheckbox:${ImportType.CONTACTS}`)).toBeChecked();
    });

    it('Should open the Yahoo modal', async () => {
        mockUseUser.mockReturnValue(defaultUseUser);
        easySwitchRender(<ProviderCard app={APPS.PROTONMAIL} />);

        const yahooImport = screen.getByTestId('ProviderButton:yahooCard');
        expect(yahooImport).toBeEnabled();

        // Open Yahoo import modal
        fireEvent.click(yahooImport);
        await waitFor(() => screen.getByText(`Import your data to ${BRAND_NAME}`));

        // Select Provider is Yahoo
        screen.getAllByTestId(`productSelectionModal:${ImportProvider.YAHOO}`);

        // 3 radio buttons are displayed, and mail is selected by default
        expect(screen.getByTestId(`productRadio:${ImportType.MAIL}`)).toBeChecked();
        expect(screen.getByTestId(`productRadio:${ImportType.CALENDAR}`)).not.toBeChecked();
        expect(screen.getByTestId(`productRadio:${ImportType.CONTACTS}`)).not.toBeChecked();
    });

    it('Should switch to imap import', async () => {
        mockUseUser.mockReturnValue(defaultUseUser);
        easySwitchRender(<ProviderCard app={APPS.PROTONMAIL} />);

        const advancedImport = screen.getByTestId('ProviderButton:advancedImport');
        expect(advancedImport).toBeEnabled();

        // Open advanced import modal
        fireEvent.click(advancedImport);
        await waitFor(() => screen.getByText(`Import your data to ${BRAND_NAME}`));

        // Change provider
        fireEvent.click(screen.getByTestId('productSelectionModal:selectProvider'));
        await waitFor(() => screen.getByTestId(`productSelectionModal:${ImportProvider.DEFAULT}`));
        fireEvent.click(screen.getByTestId(`productSelectionModal:${ImportProvider.DEFAULT}`));

        // 3 radio buttons are displayed, and mail is selected by default
        expect(screen.getByTestId(`productRadio:${ImportType.MAIL}`)).toBeChecked();
        expect(screen.getByTestId(`productRadio:${ImportType.CALENDAR}`)).not.toBeChecked();
        expect(screen.getByTestId(`productRadio:${ImportType.CONTACTS}`)).not.toBeChecked();
    });

    it('Should show BYOE modal when clicking Google with BYOE feature enabled', async () => {
        mockUseBYOEFeatureStatus.mockReturnValue(true);
        mockUseUser.mockReturnValue(defaultUseUser);
        easySwitchRender(<ProviderCard app={APPS.PROTONMAIL} />);

        fireEvent.click(screen.getByTestId('ProviderButton:googleCardForward'));

        await waitFor(() => screen.getByText(`Bring your Gmail into ${MAIL_APP_NAME}`));
    });

    it('Should show forwarding modal when clicking Google with BYOE feature disabled', async () => {
        mockUseUser.mockReturnValue(defaultUseUser);
        easySwitchRender(<ProviderCard app={APPS.PROTONMAIL} />);

        fireEvent.click(screen.getByTestId('ProviderButton:googleCardForward'));

        await waitFor(() => screen.getByText('Automatically forward'));
    });

    it('Should disable calendar checkbox in advanced import when user has no calendar', async () => {
        (useWriteableCalendars as jest.Mock).mockReturnValueOnce([[], false]);
        mockUseUser.mockReturnValue(defaultUseUser);
        easySwitchRender(<ProviderCard app={APPS.PROTONMAIL} />);

        fireEvent.click(screen.getByTestId('ProviderButton:advancedImport'));
        await waitFor(() => screen.getByText(`Import your data to ${BRAND_NAME}`));

        expect(screen.getByTestId(`productCheckbox:${ImportType.CALENDAR}`)).toBeDisabled();
    });

    it('Should disable calendar checkbox in advanced import for BYOE-only account', async () => {
        mockUseAddresses.mockReturnValue([[{ Flags: ADDRESS_FLAGS.BYOE }], false]);
        mockUseUser.mockReturnValue(defaultUseUser);
        easySwitchRender(<ProviderCard app={APPS.PROTONMAIL} />);

        fireEvent.click(screen.getByTestId('ProviderButton:advancedImport'));
        await waitFor(() => screen.getByText(`Import your data to ${BRAND_NAME}`));

        expect(screen.getByTestId(`productCheckbox:${ImportType.CALENDAR}`)).toBeDisabled();
    });

    it('Should trigger yahoo auth error', async () => {
        mockUseUser.mockReturnValue(defaultUseUser);
        server.use(
            http.get('/core/v4/features', () => {
                return HttpResponse.json({}, { headers });
            }),
            http.get('/importer/v1/mail/importers/authinfo', () => {
                return HttpResponse.json({}, { headers });
            }),
            http.get('/core/v4/system/config', () => {
                return HttpResponse.json({}, { headers });
            }),
            http.get('/calendar/v1', () => {
                return HttpResponse.json({}, { headers });
            }),
            http.get('/settings/calendar', () => {
                return HttpResponse.json({}, { headers });
            }),
            http.post('/importer/v1/importers', () => {
                return HttpResponse.json(
                    {
                        Code: 2901,
                        Error: 'Invalid credentials',
                        Details: {
                            ProviderError:
                                'AUTHENTICATE command failed: NO [AUTHENTICATIONFAILED] AUTHENTICATE Invalid credentials\r\n',
                        },
                    },
                    { status: 422, headers }
                );
            })
        );

        easySwitchRender(<ProviderCard app={APPS.PROTONMAIL} />);

        const yahoo = screen.getByTestId('ProviderButton:yahooCard');
        expect(yahoo).toBeEnabled();

        // Open yahoo modal
        fireEvent.click(yahoo);
        await waitFor(() => screen.getByText(`Import your data to ${BRAND_NAME}`));

        fireEvent.click(screen.getByText('Continue'));

        // Skip instructions and expect to see calendar modal
        fireEvent.click(screen.getByTestId('Instruction:continue'));

        const emailInput = screen.getByTestId('StepForm:emailInput');
        const passwordInput = screen.getByTestId('StepForm:passwordInput');

        fireEvent.change(emailInput, { target: { value: 'testing@yahoo.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password' } });

        const nextButton = screen.getByTestId('StepForm:submitButton');
        await waitFor(() => expect(nextButton).toBeEnabled());

        fireEvent.click(nextButton);
        await waitFor(() => screen.getByTestId('StepForm:yahooAuthError'));
    });

    it('Should click on imap calendar product', async () => {
        mockUseUser.mockReturnValue(defaultUseUser);
        easySwitchRender(<ProviderCard app={APPS.PROTONMAIL} />);

        const advancedImport = screen.getByTestId('ProviderButton:advancedImport');
        expect(advancedImport).toBeEnabled();

        // Open advanced import modal
        fireEvent.click(advancedImport);
        await waitFor(() => screen.getByText(`Import your data to ${BRAND_NAME}`));

        // Change provider to Imap
        fireEvent.click(screen.getByTestId('productSelectionModal:selectProvider'));
        await waitFor(() => screen.getByTestId(`productSelectionModal:${ImportProvider.DEFAULT}`));
        fireEvent.click(screen.getByTestId(`productSelectionModal:${ImportProvider.DEFAULT}`));

        // Select calendar checkbox
        fireEvent.click(screen.getByTestId(`productRadio:${ImportType.CALENDAR}`));

        // Go to next step
        fireEvent.click(screen.getByText('Continue'));

        await waitFor(() => screen.getByTestId('Instruction:defaultCalendarInstructions'));
    });
});
