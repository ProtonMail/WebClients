import { fireEvent, screen, waitFor } from '@testing-library/dom';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { easySwitchRender } from '@proton/activation/src/tests/render';
import { useUser } from '@proton/components/index';

import ProviderCards from './ProviderCards';

const defaultUseUser = [
    {
        isAdmin: true,
        isFree: true,
        isMember: true,
        isPaid: true,
        isPrivate: true,
        isSubUser: true,
        isDelinquent: true,
        hasNonDelinquentScope: true,
        hasPaidMail: true,
        hasPaidVpn: true,
        canPay: true,
    },
    false,
];

jest.mock('@proton/components/hooks/useUser');
const mockUseUser = useUser as jest.MockedFunction<any>;

jest.mock('@proton/components/hooks/useFeature', () => () => {
    return {
        feature: {
            Code: 'EasySwitch',
            Type: 'mixed',
            Global: true,
            DefaultValue: {
                GoogleMail: true,
                GoogleCalendar: true,
                GoogleContacts: true,
                GoogleDrive: false,
                OutlookMail: true,
                OutlookCalendar: true,
                OutlookContacts: true,
                OtherMail: true,
                OtherCalendar: true,
                OtherContacts: true,
                OtherDrive: false,
            },
            Value: {
                GoogleMail: true,
                GoogleCalendar: true,
                GoogleContacts: true,
                GoogleDrive: false,
                OutlookMail: true,
                OutlookCalendar: true,
                OutlookContacts: true,
                OtherMail: true,
                OtherCalendar: true,
                OtherContacts: true,
                OtherDrive: false,
            },
            Writable: false,
        },
    };
});

jest.mock('@proton/components/hooks/useCalendars', () => () => [
    [
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
    ],
    false,
]);

const server = setupServer();

beforeAll(() => {
    server.listen();
    server.use(
        rest.get('/core/v4/features', (req, res, ctx) => {
            return res(ctx.set('date', '01/01/2022'), ctx.json({}));
        }),
        rest.get('/importer/v1/mail/importers/authinfo', (req, res, ctx) => {
            return res(ctx.set('date', '01/01/2022'), ctx.json({}));
        }),
        rest.get('/core/v4/system/config', (req, res, ctx) => {
            return res(ctx.set('date', '01/01/2022'), ctx.json({}));
        }),
        rest.get('/calendar/v1', (req, res, ctx) => {
            return res(ctx.set('date', '01/01/2022'), ctx.json({}));
        })
    );
});
afterEach(() => server.resetHandlers());
afterAll(() => {
    server.close();
});

describe('Provider cards process testing', () => {
    it('Should display the four cards on the page without user data', async () => {
        mockUseUser.mockReturnValue(defaultUseUser);
        easySwitchRender(<ProviderCards />);

        const google = screen.getByTestId('ProviderCard:googleCard');
        const yahoo = screen.getByTestId('ProviderCard:yahooCard');
        const outlook = screen.getByTestId('ProviderCard:outlookCard');
        const imap = screen.getByTestId('ProviderCard:imapCard');

        expect(google).toBeEnabled();
        expect(yahoo).toBeEnabled();
        expect(outlook).toBeEnabled();
        expect(imap).toBeEnabled();

        // Open imap modal
        fireEvent.click(imap);
        await waitFor(() => screen.getByTestId('MailModal:ProductModal'));
        let productButtons = screen.getAllByTestId('MailModal:ProductButton');
        expect(productButtons).toHaveLength(3);

        // Close imap modal
        let closeButton = screen.getByTestId('modal:close');
        fireEvent.click(closeButton);
        await waitFor(() => screen.queryAllByTestId('MailModal:ProductModal'));
        productButtons = screen.queryAllByTestId('MailModal:ProductButton');
        expect(productButtons).toStrictEqual([]);

        // Open yahoo modal
        fireEvent.click(yahoo);
        await waitFor(() => screen.getByTestId('MailModal:ProductModal'));
        productButtons = screen.getAllByTestId('MailModal:ProductButton');
        expect(productButtons).toHaveLength(3);
        closeButton = screen.getByTestId('modal:close');

        // Close yahoo modal
        closeButton = screen.getByTestId('modal:close');
        fireEvent.click(closeButton);
        await waitFor(() => screen.queryAllByTestId('MailModal:ProductModal'));
        productButtons = screen.queryAllByTestId('MailModal:ProductButton');
        expect(productButtons).toStrictEqual([]);
    });

    it('Should trigger yahoo auth error', async () => {
        mockUseUser.mockReturnValue(defaultUseUser);
        server.use(
            rest.get('/core/v4/features', (req, res, ctx) => {
                return res(ctx.set('date', '01/01/2022'), ctx.json({}));
            }),
            rest.get('/importer/v1/mail/importers/authinfo', (req, res, ctx) => {
                return res(ctx.set('date', '01/01/2022'), ctx.json({}));
            }),
            rest.get('/core/v4/system/config', (req, res, ctx) => {
                return res(ctx.set('date', '01/01/2022'), ctx.json({}));
            }),
            rest.get('/calendar/v1', (req, res, ctx) => {
                return res(ctx.set('date', '01/01/2022'), ctx.json({}));
            }),
            rest.get('/settings/calendar', (req, res, ctx) => {
                return res(ctx.set('date', '01/01/2022'), ctx.json({}));
            }),
            rest.post('/importer/v1/importers', (req, res, ctx) => {
                return res(
                    ctx.set('date', '01/01/2022'),
                    ctx.status(422),
                    ctx.json({
                        Code: 2901,
                        Error: 'Invalid credentials',
                        Details: {
                            ProviderError:
                                'AUTHENTICATE command failed: NO [AUTHENTICATIONFAILED] AUTHENTICATE Invalid credentials\r\n',
                        },
                    })
                );
            })
        );

        easySwitchRender(<ProviderCards />);

        const yahoo = screen.getByTestId('ProviderCard:yahooCard');

        // Open imap product modal and click calendar
        fireEvent.click(yahoo);
        await waitFor(() => screen.getByTestId('MailModal:ProductModal'));
        const productButtons = screen.getAllByTestId('MailModal:ProductButton');
        expect(productButtons).toHaveLength(3);
        fireEvent.click(productButtons[0]);

        // SKip instructions and expect to see calendar modal
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
        easySwitchRender(<ProviderCards />);

        const imap = screen.getByTestId('ProviderCard:imapCard');

        // Open imap product modal and click calendar
        fireEvent.click(imap);
        await waitFor(() => screen.getByTestId('MailModal:ProductModal'));
        const productButtons = screen.getAllByTestId('MailModal:ProductButton');
        expect(productButtons).toHaveLength(3);
        fireEvent.click(productButtons[1]);

        // SKip instructions and expect to see calendar modal
        fireEvent.click(screen.getByTestId('Instruction:continue'));
    });

    it('Should click on every product in the imap modal', async () => {
        mockUseUser.mockReturnValue(defaultUseUser);
        easySwitchRender(<ProviderCards />);

        const imap = screen.getByTestId('ProviderCard:imapCard');

        // Open imap modal and click on email
        fireEvent.click(imap);
        await waitFor(() => screen.getByTestId('MailModal:ProductModal'));
        let productButtons = screen.getAllByTestId('MailModal:ProductButton');
        expect(productButtons).toHaveLength(3);
        fireEvent.click(productButtons[0]);

        await waitFor(() => screen.getByTestId('Instruction:defaultMailInstructions'));
        fireEvent.click(screen.getByTestId('Instruction:close'));

        // Open imap modal and click on contact
        fireEvent.click(imap);
        await waitFor(() => screen.getByTestId('MailModal:ProductModal'));
        productButtons = screen.getAllByTestId('MailModal:ProductButton');
        expect(productButtons).toHaveLength(3);
        fireEvent.click(productButtons[1]);

        await waitFor(() => screen.getByTestId('Instruction:defaultCalendarInstructions'));
        fireEvent.click(screen.getByTestId('Instruction:close'));

        // Open imap modal and click on contact
        fireEvent.click(imap);
        await waitFor(() => screen.getByTestId('MailModal:ProductModal'));
        productButtons = screen.getAllByTestId('MailModal:ProductButton');
        expect(productButtons).toHaveLength(3);
        fireEvent.click(productButtons[2]);

        await waitFor(() => screen.getByTestId('Instruction:defaultContactInstructions'));
        fireEvent.click(screen.getByTestId('Instruction:close'));
    });

    it('Should click on every product in the yahoo modal', async () => {
        mockUseUser.mockReturnValue(defaultUseUser);
        easySwitchRender(<ProviderCards />);

        const yahoo = screen.getByTestId('ProviderCard:yahooCard');

        // Open yahoo modal and click on email
        fireEvent.click(yahoo);
        await waitFor(() => screen.getByTestId('MailModal:ProductModal'));
        let productButtons = screen.getAllByTestId('MailModal:ProductButton');
        expect(productButtons).toHaveLength(3);
        fireEvent.click(productButtons[0]);

        await waitFor(() => screen.getByTestId('Instruction:yahooMailInstructions'));
        fireEvent.click(screen.getByTestId('Instruction:close'));

        // Open yahoo modal and click on contact
        fireEvent.click(yahoo);
        await waitFor(() => screen.getByTestId('MailModal:ProductModal'));
        productButtons = screen.getAllByTestId('MailModal:ProductButton');
        expect(productButtons).toHaveLength(3);
        fireEvent.click(productButtons[1]);

        await waitFor(() => screen.getByTestId('Instruction:yahooCalendarInstructions'));
        fireEvent.click(screen.getByTestId('Instruction:close'));

        // Open yahoo modal and click on contact
        fireEvent.click(yahoo);
        await waitFor(() => screen.getByTestId('MailModal:ProductModal'));
        productButtons = screen.getAllByTestId('MailModal:ProductButton');
        expect(productButtons).toHaveLength(3);
        fireEvent.click(productButtons[2]);

        await waitFor(() => screen.getByTestId('Instruction:yahooContactInstructions'));
        fireEvent.click(screen.getByTestId('Instruction:close'));
    });

    it('Should disable all cards if user is delinquent', () => {
        mockUseUser.mockReturnValue([{ hasNonDelinquentScope: false }, false]);

        easySwitchRender(<ProviderCards />);

        const google = screen.getByTestId('ProviderCard:googleCard');
        const yahoo = screen.getByTestId('ProviderCard:yahooCard');
        const outlook = screen.getByTestId('ProviderCard:outlookCard');
        const imap = screen.getByTestId('ProviderCard:imapCard');

        expect(google).toBeDisabled();
        expect(yahoo).toBeDisabled();
        expect(outlook).toBeDisabled();
        expect(imap).toBeDisabled();
    });

    it('Should disable all cards while user is loading', () => {
        mockUseUser.mockReturnValue([{ hasNonDelinquentScope: true }, true]);

        easySwitchRender(<ProviderCards />);

        const google = screen.getByTestId('ProviderCard:googleCard');
        const yahoo = screen.getByTestId('ProviderCard:yahooCard');
        const outlook = screen.getByTestId('ProviderCard:outlookCard');
        const imap = screen.getByTestId('ProviderCard:imapCard');

        expect(google).toBeDisabled();
        expect(yahoo).toBeDisabled();
        expect(outlook).toBeDisabled();
        expect(imap).toBeDisabled();
    });
});
