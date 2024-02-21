import React, { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mocked } from 'jest-mock';

import { useNotifications } from '@proton/components/hooks';
import { PassBridge } from '@proton/pass/lib/bridge/types';
import { HydratedAccessState } from '@proton/pass/store/reducers';
import { mockNotifications } from '@proton/testing/index';

import PassAliases from './PassAliases';
import * as passAliasesProvider from './PassAliasesProvider';

jest.mock('@proton/components/hooks/useNotifications');
jest.mock('@proton/pass/lib/bridge/PassBridgeProvider', () => ({
    PassBridgeProvider: ({ children }: { children: ReactNode }) => children,
    usePassBridge: (): PassBridge => {
        return {
            vault: {
                getDefault: async () => {
                    return {
                        shareId: 'test-share-id',
                        content: {
                            name: 'Test Vault',
                        },
                    } as any;
                },
            },
            user: {
                getUserAccess: () => {
                    return new Promise((res) => {
                        res({
                            plan: {
                                AliasLimit: 10,
                            },
                        } as HydratedAccessState);
                    });
                },
            },
            alias: {
                create: jest.fn(),
                getAliasOptions: jest.fn(),
                getAllByShareId: async () => [],
            },
            init: async () => true,
        };
    },
}));
jest.mock('@proton/components/hooks/useUser', () => jest.fn().mockImplementation(() => [{}, false]));
jest.mock('@proton/components/hooks/useSubscription', () => jest.fn().mockImplementation(() => [{}, false]));
jest.mock('@proton/components/components/link/SettingsLink', () => 'string');
jest.mock('@proton/components/containers/app/ErrorBoundary', () => {
    return {
        __esModule: true,
        default: ({ children }: { children: ReactNode }) => children,
    };
});

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
            hasReachedAliasesCountLimit: false,
            hadInitialisedPreviously: false,
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
            hasReachedAliasesCountLimit: false,
            hadInitialisedPreviously: false,
        }));

        render(<PassAliases />);

        // Assert that the "No aliases" message is rendered
        expect(
            screen.getByText(
                'Hide-my-email aliases let you sign up for things online without sharing your email address.'
            )
        ).toBeInTheDocument();

        expect(screen.getByText('Create an alias')).toBeInTheDocument();
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
            hasReachedAliasesCountLimit: false,
            hadInitialisedPreviously: false,
        }));

        render(<PassAliases />);

        await userEvent.click(screen.getByText('Create an alias'));

        // Assert that the create alias modal is opened
        expect(screen.getByTestId('pass-aliases:create')).toBeInTheDocument();
    });
});
