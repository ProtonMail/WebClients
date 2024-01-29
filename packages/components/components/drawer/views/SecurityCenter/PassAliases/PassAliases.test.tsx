import React, { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mocked } from 'jest-mock';

import { useNotifications } from '@proton/components/hooks';
import { mockNotifications } from '@proton/testing/index';

import PassAliases from './PassAliases';
import * as passAliasesProvider from './PassAliasesProvider';

jest.mock('@proton/components/hooks/useNotifications');
jest.mock('@proton/pass/lib/bridge/PassBridgeProvider', () => ({
    PassBridgeProvider: ({ children }: { children: ReactNode }) => children,
    usePassBridge: () => {},
}));
jest.mock('@proton/components/hooks/useUser', () => jest.fn().mockImplementation(() => [{}, false]));
jest.mock('@proton/components/hooks/useSubscription', () => jest.fn().mockImplementation(() => [{}, false]));
jest.mock('@proton/components/components/link/SettingsLink', () => 'string');

describe('PassAliases', () => {
    const mockedUseNotifications = mocked(useNotifications);

    beforeEach(async () => {
        mockedUseNotifications.mockImplementation(() => mockNotifications);
    });

    it('renders the aliases list when there are aliases', async () => {
        jest.spyOn(passAliasesProvider, 'usePassAliasesContext').mockImplementation(() => ({
            hasAliases: true,
            hasUsedProtonPassApp: false,
            loading: false,
            passAliasesVaultName: 'Test Vault',
            passAliasesItems: [
                {
                    item: {
                        aliasEmail: 'dude@dude.fr',
                        createTime: Date.now(),
                        data: {
                            metadata: {
                                name: 'Dude',
                            },
                        },
                    },
                },
            ] as any,
            getAliasOptions: jest.fn(),
            submitNewAlias: jest.fn(),
            passAliasesUpsellModal: {} as any,
        }));

        render(<PassAliases />);

        // Assert that the aliases list is rendered
        expect(screen.getByText('dude@dude.fr')).toBeInTheDocument();
        // Button should be "New alias"
        expect(screen.getByText('New alias')).toBeInTheDocument();
    });

    it('renders the "No aliases" message when there are no aliases', () => {
        jest.spyOn(passAliasesProvider, 'usePassAliasesContext').mockImplementation(() => ({
            hasAliases: false,
            hasUsedProtonPassApp: false,
            loading: false,
            passAliasesVaultName: 'Test Vault',
            passAliasesItems: [],
            getAliasOptions: jest.fn(),
            submitNewAlias: jest.fn(),
            passAliasesUpsellModal: {} as any,
        }));

        render(<PassAliases />);

        // Assert that the "No aliases" message is rendered
        expect(
            screen.getByText(
                'Hide-my-email aliases let you sign up for things online without sharing your email address.'
            )
        ).toBeInTheDocument();
        // Button should be "New alias"
        expect(screen.getByText('Get an alias')).toBeInTheDocument();
    });

    it('opens the create alias modal when the "Get an alias" button is clicked', async () => {
        jest.spyOn(passAliasesProvider, 'usePassAliasesContext').mockImplementation(() => ({
            hasAliases: false,
            hasUsedProtonPassApp: false,
            loading: false,
            passAliasesVaultName: 'Test Vault',
            passAliasesItems: [],
            getAliasOptions: jest.fn(),
            submitNewAlias: jest.fn(),
            passAliasesUpsellModal: {} as any,
        }));

        render(<PassAliases />);

        // Click the "Get an alias" button
        await userEvent.click(screen.getByText('Get an alias'));

        // Assert that the create alias modal is opened
        expect(screen.getByTestId('pass-aliases:create')).toBeInTheDocument();
    });
});
