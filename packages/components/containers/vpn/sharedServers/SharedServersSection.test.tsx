import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getModelState } from '@proton/account/test';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { buildSubscription } from '@proton/testing/builders';
import { getOrganizationState, getSubscriptionState } from '@proton/testing/index';

import { renderWithProviders } from '../../contacts/tests/render';
import { organization } from '../../payments/subscription/__mocks__/data';
import SharedServersSection from './SharedServersSection';
import { SharedServersBuilder } from './SharedServersSection.test.builder';
import useSharedServersHook from './useSharedServers';

jest.mock('@proton/components/hooks/useNotifications', () =>
    jest.fn().mockReturnValue({ createNotification: jest.fn() })
);

jest.mock('@proton/components/containers/vpn/sharedServers/useSharedServers');

const useSharedServersMock = useSharedServersHook as jest.Mock;
const vpnSubscription = buildSubscription();

describe('SharedServersSection', () => {
    const preloadedState = {
        subscription: getSubscriptionState(vpnSubscription),
        user: getModelState({ ...({ ID: 'user-123' } as UserModel) }),
        organization: getOrganizationState(organization),
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('defaults to Off mode when org has no policies', async () => {
        const mock = new SharedServersBuilder().withoutPolicies().build();
        useSharedServersMock.mockReturnValue(mock);

        renderWithProviders(<SharedServersSection />, { preloadedState });

        expect(
            await screen.findByRole('button', {
                name: /^off\b/i,
                pressed: true,
            })
        ).toBeInTheDocument();
    });

    it('Off mode is selected when org has deny policy', async () => {
        const mock = new SharedServersBuilder().withDenyPolicy().build();
        useSharedServersMock.mockReturnValue(mock);

        renderWithProviders(<SharedServersSection />, { preloadedState });

        expect(
            await screen.findByRole('button', {
                name: /^off\b/i,
                pressed: true,
            })
        ).toBeInTheDocument();
    });

    it('On mode is selected when org has allow-all policy', async () => {
        const mock = new SharedServersBuilder().withAllowAllPolicy().build();
        useSharedServersMock.mockReturnValue(mock);

        renderWithProviders(<SharedServersSection />, { preloadedState });

        expect(
            await screen.findByRole('button', {
                name: /^on\b/i,
                pressed: true,
            })
        ).toBeInTheDocument();
    });

    it('"Publish changes" banner appears when switching modes', async () => {
        const mock = new SharedServersBuilder().withAllowAllPolicy().build();
        useSharedServersMock.mockReturnValue(mock);

        renderWithProviders(<SharedServersSection />, { preloadedState });

        act(() => {
            const offMode = screen.getByRole('button', { name: /^off\b/i, pressed: false });
            offMode.click();
        });

        expect(screen.getByText('You have unpublished changes')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /^publish changes\b/i, busy: false })).toBeInTheDocument();
    });

    it('Publishing changes triggers confirmation banner', async () => {
        const mock = new SharedServersBuilder().withAllowAllPolicy().build();
        useSharedServersMock.mockReturnValue(mock);

        renderWithProviders(<SharedServersSection />, { preloadedState });

        await act(async () => {
            const offMode = await screen.findByRole('button', { name: /^off\b/i, pressed: false });
            offMode.click();
        });

        await act(async () => {
            await expect(screen.findByText('You have unpublished changes')).resolves.toBeInTheDocument();
            const publish = await screen.findByRole('button', { name: 'Publish changes', busy: false });
            await userEvent.click(publish);
        });

        await waitFor(() => {});

        await expect(screen.findByText(/Your recent changes have been published/)).resolves.toBeInTheDocument();
        await expect(screen.findByRole('button', { name: 'Dismiss', busy: false })).resolves.toBeInTheDocument();
    });

    it.each`
        amount | sharedServerText
        ${1}   | ${'Shared server country (1)'}
        ${5}   | ${'Shared server countries (5)'}
    `('shows $sharedServerText when On mode is active', async ({ amount, sharedServerText }) => {
        const mock = new SharedServersBuilder().withAllowAllPolicy().withLocations(amount).build();
        useSharedServersMock.mockReturnValue(mock);

        renderWithProviders(<SharedServersSection />, { preloadedState });

        expect(
            await screen.findByRole('button', {
                name: /^on\b/i,
                pressed: true,
            })
        ).toBeInTheDocument();

        const headline = await screen.findByText(sharedServerText);
        expect(headline).toBeInTheDocument();
    });

    it('Shared server countries are hidden with Off mode', async () => {
        const amount = 5;
        const mock = new SharedServersBuilder().withDenyPolicy().withLocations(amount).build();
        useSharedServersMock.mockReturnValue(mock);

        renderWithProviders(<SharedServersSection />, { preloadedState });

        expect(screen.queryByText(`Shared server countries ${amount}`)).not.toBeInTheDocument();
    });

    describe('Custom policies', () => {
        it('"Create new policy" shows up when switching to Custom mode', async () => {
            const mock = new SharedServersBuilder().withCustomPolicy().build();
            useSharedServersMock.mockReturnValue(mock);

            renderWithProviders(<SharedServersSection />, { preloadedState });

            await act(async () => {
                const createNewPolicy = await screen.findByRole('button', { name: /Create new policy/ });

                expect(createNewPolicy).toBeInTheDocument();
            });
        });

        it.each`
            countries | expectedCountriesText
            ${1}      | ${'1 country enabled'}
            ${2}      | ${'2 countries enabled'}
        `(
            'Creating new policy with $countries countries enabled shows up in list',
            async ({ countries, expectedCountriesText }) => {
                const policyName = 'Awesome policy';
                const amount = 3;
                const mock = new SharedServersBuilder()
                    .withUsers(amount)
                    .withLocations(countries)
                    .withCustomPolicy()
                    .build();

                useSharedServersMock.mockReturnValue(mock);

                renderWithProviders(<SharedServersSection />, { preloadedState });

                const createNewPolicy = await screen.findByRole('button', {
                    name: /create new policy/i,
                });
                await userEvent.click(createNewPolicy);
                // Add policy name step
                const input = await screen.findByLabelText(/policy name/i);
                await userEvent.type(input, policyName);
                await userEvent.click(screen.getByRole('button', { name: 'Continue', busy: false }));

                // Add users to policy step
                expect(screen.getByText(`Add users to "${policyName}"`)).toBeInTheDocument();
                const heading = await screen.findByRole('heading', {
                    name: /add users to/i,
                });

                const userSelectionForm = heading.closest('form');
                if (!userSelectionForm) {
                    throw new Error('Selection form not found');
                }

                expect(userSelectionForm).toBeInTheDocument();
                const checkboxes = await within(userSelectionForm).findAllByRole('checkbox', { checked: false });
                expect(checkboxes).toHaveLength(amount + 1); // All users + the select all users
                const allUsersCheckbox = within(userSelectionForm).getByRole('checkbox', {
                    name: /users/i,
                });
                await userEvent.click(allUsersCheckbox);
                await userEvent.click(within(userSelectionForm).getByRole('button', { name: 'Continue', busy: false }));

                // Add countries to policy step
                expect(screen.getByText(`Add countries to "${policyName}"`)).toBeInTheDocument();
                const allCountriesCheckbox = (await screen.findAllByRole('checkbox'))[0];
                await userEvent.click(allCountriesCheckbox);
                await userEvent.click(within(userSelectionForm).getByRole('button', { name: 'Save', busy: false }));

                // Find policy in the list below
                const createdPolicy = await screen.findByText(policyName);
                expect(createdPolicy).toBeInTheDocument();
                const createdPolicyCountries = await screen.findByText(expectedCountriesText);
                expect(createdPolicyCountries).toBeInTheDocument();
            }
        );
    });
});
