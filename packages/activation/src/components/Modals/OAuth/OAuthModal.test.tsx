import { fireEvent, screen, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';

import { headers } from '@proton/activation/msw.header';
import { easySwitchRender } from '@proton/activation/src/tests/render';
import { APPS } from '@proton/shared/lib/constants';

import ProviderCard from '../../SettingsArea/ProviderCards/ProviderCard';

const server = setupServer();

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

jest.mock('@proton/account/user/hooks', () => ({
    __esModule: true,
    useUser: jest.fn(() => [
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
    ]),
    useGetUser: jest.fn(() => [
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
    ]),
}));

jest.mock('@proton/features/useFeature', () => () => {
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
        http.get('/core/v4/system/config', () => {
            return HttpResponse.json({}, { headers });
        }),
        http.get('/calendar/v1', () => {
            return HttpResponse.json({}, { headers });
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
        easySwitchRender(<ProviderCard app={APPS.PROTONMAIL} />);

        const google = screen.getByTestId('ProviderButton:googleCard');

        expect(google).toBeEnabled();

        fireEvent.click(google);

        await waitFor(() => screen.getByTestId('StepProducts:modal'));
    });

    it.skip('Should render the product selection modal when clicking on Outlook', async () => {
        easySwitchRender(<ProviderCard app={APPS.PROTONMAIL} />);

        const outlook = screen.getByTestId('ProviderButton:outlookCard');

        expect(outlook).toBeEnabled();

        fireEvent.click(outlook);

        await waitFor(() => screen.getByTestId('StepProducts:modal'));
    });

    it('Should render the instruction modal if Google is selected', async () => {
        easySwitchRender(<ProviderCard app={APPS.PROTONMAIL} />);

        // Open the product modal
        const google = screen.getByTestId('ProviderButton:googleCard');
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
            http.get('/calendar/v1', () => {
                return HttpResponse.json({}, { headers });
            })
        );

        easySwitchRender(<ProviderCard app={APPS.PROTONMAIL} />);

        // Open the product modal
        const outlook = screen.getByTestId('ProviderButton:outlookCard');
        expect(outlook).toBeEnabled();
        fireEvent.click(outlook);

        await waitFor(() => screen.getByTestId('StepProducts:modal'));

        // Submit products modal
        const submitProducts = screen.getByTestId('StepProducts:submit');
        fireEvent.click(submitProducts);
    });

    it('Should render the product and instructions modal when Google is selected', async () => {
        server.use(
            http.get('/calendar/v1', () => {
                return HttpResponse.json({}, { headers });
            })
        );

        easySwitchRender(<ProviderCard app={APPS.PROTONMAIL} />);

        // Open the product modal
        const google = screen.getByTestId('ProviderButton:googleCard');
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
