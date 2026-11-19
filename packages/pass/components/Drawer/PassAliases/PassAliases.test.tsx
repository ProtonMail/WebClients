import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useNotifications } from '@proton/app-context/useNotifications';
import { mockNotifications } from '@proton/components/testing/vitest/mockNotifications';

import PassAliases from './PassAliases';
import * as passAliasesProvider from './PassAliasesProvider';

vi.mock('./PassAliasesProvider', async () => ({
    __esModule: true,
    ...(await vi.importActual('./PassAliasesProvider')),
}));

vi.mock('../../../lib/bridge/PassBridgeProvider', async () => ({
    __esModule: true,
    PassBridgeProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('./usePassAliasesProviderSetup', async () => ({
    __esModule: true,
    usePassAliasesSetup: () => {},
}));

vi.mock('@proton/app-context/useNotifications');
vi.mock('@proton/account/addresses/hooks', () => ({ default: vi.fn().mockImplementation(() => [[], false]) }));
vi.mock('@proton/components/hooks/useAuthentication', () => ({
    default: vi.fn().mockImplementation(() => [{}, false]),
}));
vi.mock('@proton/account/user/hooks', () => ({ default: vi.fn().mockImplementation(() => [{}, false]) }));
vi.mock('@proton/account/subscription/hooks', () => ({ default: vi.fn().mockImplementation(() => [{}, false]) }));
vi.mock('@proton/components/components/link/SettingsLink', () => ({ default: 'string' }));
vi.mock('@proton/components/containers/app/ErrorBoundary', async () => ({
    __esModule: true,
    default: ({ children }: { children: ReactNode }) => children,
}));

describe('PassAliases', () => {
    const mockedUseNotifications = vi.mocked(useNotifications);

    beforeEach(async () => {
        mockedUseNotifications.mockImplementation(() => mockNotifications);
    });

    it('renders the aliases list when there are aliases', async () => {
        vi.spyOn(passAliasesProvider, 'usePassAliasesContext').mockImplementation(() => ({
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
            getAliasOptions: vi.fn(),
            submitNewAlias: vi.fn(),
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
        vi.spyOn(passAliasesProvider, 'usePassAliasesContext').mockImplementation(() => ({
            hasAliases: false,
            hasUsedProtonPassApp: false,
            loading: false,
            passAliasesVaultName: 'Test Vault',
            passAliasesItems: [],
            getAliasOptions: vi.fn(),
            submitNewAlias: vi.fn(),
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
        vi.spyOn(passAliasesProvider, 'usePassAliasesContext').mockImplementation(() => ({
            hasAliases: false,
            hasUsedProtonPassApp: false,
            loading: false,
            passAliasesVaultName: 'Test Vault',
            passAliasesItems: [],
            getAliasOptions: vi.fn(),
            submitNewAlias: vi.fn(),
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
