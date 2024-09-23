import { useUserSettings } from '@proton/components/hooks';

import { render } from 'proton-mail/helpers/test/render';

import AccountsLoginModal from './AccountsLoginModal';
import { getOnlineServices } from './getOnlineServices';

jest.mock('@proton/components/hooks/useUserSettings');
const mockedUserSettings = useUserSettings as jest.MockedFunction<any>;

describe('AccountsLoginModal', () => {
    it('Should render all services for US user', async () => {
        mockedUserSettings.mockReturnValue([{ Locale: 'en_US' }]);
        const { getAllByTestId } = await render(
            <AccountsLoginModal open onClose={jest.fn} onExit={jest.fn} key="us" />
        );
        const links = getOnlineServices();
        const allLinks = links.map((item) => item.services).flat();

        expect(getAllByTestId('accounts-login-modal-service-item')?.length).toEqual(allLinks.length);
    });

    it('Should render part of services for non US users', async () => {
        mockedUserSettings.mockReturnValue([{ Locale: 'fr_CH' }]);

        const { getAllByTestId } = await render(
            <AccountsLoginModal open onClose={jest.fn} onExit={jest.fn} key="non_us" />
        );
        const links = getOnlineServices();
        const allLinks = links
            .map((item) => item.services)
            .flat()
            .filter((item) => item.country !== 'US');

        expect(getAllByTestId('accounts-login-modal-service-item')?.length).toEqual(allLinks.length);
    });
});
