import { fireEvent, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';

import { easySwitchRender } from '@proton/activation/src/tests/render';

import ProviderCards from '../../SettingsArea/ProviderCards/ProviderCards';

const server = setupServer();

jest.mock('@proton/components/hooks/useApiEnvironmentConfig', () => () => [
    {
        'importer.google.client_id': 'string',
        'importer.outlook.client_id': 'string',
    },
    false,
]);

jest.mock('@proton/components/hooks/useUser', () => () => [
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
]);

jest.mock('@proton/components/hooks/useFeature', () => () => {
    return {
        feature: {
            Code: 'EasySwitch',
            Type: 'boolean',
            Global: true,
            DefaultValue: {
                GoogleMail: true,
                GoogleMailSync: true,
                GoogleCalendar: true,
                GoogleContacts: true,
                OutlookMail: true,
                OutlookCalendar: true,
                OutlookContacts: true,
                OtherMail: true,
                OtherCalendar: true,
                OtherContacts: true,
            },
            Value: {
                GoogleMail: true,
                GoogleMailSync: true,
                GoogleCalendar: true,
                GoogleContacts: true,
                OutlookMail: true,
                OutlookCalendar: true,
                OutlookContacts: true,
                OtherMail: true,
                OtherCalendar: true,
                OtherContacts: true,
            },
            Writable: false,
        },
    };
});

beforeAll(() => {
    server.listen();
    server.use(
        rest.get('/core/v4/system/config', (req, res, ctx) => {
            return res(ctx.set('date', '01/01/2022'), ctx.json({}));
        }),
        rest.get('/calendar/v1', (req, res, ctx) => {
            return res(ctx.set('date', '01/01/2022'), ctx.json({}));
        })
    );
});
afterEach(() => {
    server.resetHandlers();
});
afterAll(() => {
    server.close();
});

describe('OAuth start step', () => {
    it.skip('Should render the product selection modal when clicking on Google', async () => {
        easySwitchRender(<ProviderCards />);

        const google = screen.getByTestId('ProviderCard:googleCard');

        expect(google).toBeEnabled();

        fireEvent.click(google);

        await waitFor(() => screen.getByTestId('StepProducts:modal'));
    });

    it.skip('Should render the product selection modal when clicking on Outlook', async () => {
        easySwitchRender(<ProviderCards />);

        const outlook = screen.getByTestId('ProviderCard:outlookCard');

        expect(outlook).toBeEnabled();

        fireEvent.click(outlook);

        await waitFor(() => screen.getByTestId('StepProducts:modal'));
    });

    it('Should render the instruction modal if Google is selected', async () => {
        easySwitchRender(<ProviderCards />);

        // Open the product modal
        const google = screen.getByTestId('ProviderCard:googleCard');
        expect(google).toBeEnabled();
        fireEvent.click(google);

        await waitFor(() => screen.getByTestId('StepProducts:modal'));

        // Submit products modal
        const submitProducts = screen.getByTestId('StepProducts:submit');
        fireEvent.click(submitProducts);

        // Wait for instructions modal
        await waitFor(() => screen.getByTestId('StepInstruction:modal'));

        // Press back button on instruction modal
        const backButton = screen.getByTestId('StepInstruction:back');
        fireEvent.click(backButton);

        // Expect to see products modal again
        await waitFor(() => screen.getByTestId('StepProducts:modal'));
    });

    it('Should render the product modal and fire submit', async () => {
        server.use(
            rest.get('/calendar/v1', (req, res, ctx) => {
                return res(ctx.set('date', '01/01/2022'), ctx.json({}));
            })
        );

        easySwitchRender(<ProviderCards />);

        // Open the product modal
        const outlook = screen.getByTestId('ProviderCard:outlookCard');
        expect(outlook).toBeEnabled();
        fireEvent.click(outlook);

        await waitFor(() => screen.getByTestId('StepProducts:modal'));

        // Submit products modal
        const submitProducts = screen.getByTestId('StepProducts:submit');
        fireEvent.click(submitProducts);
    });

    it('Should render the product and instructions modal when Google is selected', async () => {
        server.use(
            rest.get('/calendar/v1', (req, res, ctx) => {
                return res(ctx.set('date', '01/01/2022'), ctx.json({}));
            })
        );

        easySwitchRender(<ProviderCards />);

        // Open the product modal
        const google = screen.getByTestId('ProviderCard:googleCard');
        expect(google).toBeEnabled();
        fireEvent.click(google);

        await waitFor(() => screen.getByTestId('StepProducts:modal'));

        // Submit products modal
        const submitProducts = screen.getByTestId('StepProducts:submit');
        fireEvent.click(submitProducts);

        // Wait for instructions modal
        await waitFor(() => screen.getByTestId('StepInstruction:modal'));

        // Press submit button on instruction modal
        const submitButton = screen.getByTestId('StepInstruction:submit');
        fireEvent.click(submitButton);
    });
});
