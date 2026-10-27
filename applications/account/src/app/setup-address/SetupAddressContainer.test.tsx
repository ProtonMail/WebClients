import { screen } from '@testing-library/react';

import { getModelState } from '@proton/account/testing/getModelState';
import { renderWithProviders } from '@proton/components/testing/renderWithProviders';
import { APPS, SETUP_ADDRESS_PATH } from '@proton/shared/lib/constants';
import { UserType } from '@proton/shared/lib/interfaces/User';
import { buildUser } from '@proton/shared/testing/buildUser';

import SetupAddressContainer from './SetupAddressContainer';

describe('SetupAddressContainer', () => {
    it.each([
        // Would be sent back to the app, and from its fork back here, if the page didn't check for it first
        ['a non-private', 0],
        // Would be shown a form whose submission the API refuses
        ['a private', 1],
    ])('tells %s managed external account to ask its administrator for an address', async (_, Private) => {
        const user = buildUser({
            Type: UserType.MANAGED,
            Private,
            Flags: { ...buildUser().Flags, 'no-proton-address': true },
        });

        renderWithProviders(<SetupAddressContainer />, {
            initialUrl: `${SETUP_ADDRESS_PATH}?to=${APPS.PROTONMAIL}`,
            preloadedState: { user: getModelState(user) },
        });

        expect(
            await screen.findByText(/An administrator of your organization can create one for you/)
        ).toBeInTheDocument();
        expect(screen.queryByTestId('text:generate-internal-address')).not.toBeInTheDocument();
    });
});
