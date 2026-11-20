import type { ReactNode } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import { BYOEMobile } from './BYOEMobile';

const mockStartOAuthFlowIfAllowed = vi.fn();
let mockContext: any;
vi.mock('./context/BYOEMobileProvider', () => ({
    BYOEMobileProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
    useBYOEMobile: () => mockContext,
}));

vi.mock('@proton/activation/src/logic/EasySwitchStoreInitializer', () => ({
    __esModule: true,
    default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('@proton/activation/src/logic/StoreProvider', () => ({
    __esModule: true,
    default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('@proton/byoe/src/components/ReachedLimitForwardingModal/ReachedLimitForwardingModal', () => ({
    __esModule: true,
    default: () => <div>paid limit prompt</div>,
}));
vi.mock('./components/BYOEMobileConnections/BYOEMobileConnections', () => ({ BYOEMobileConnections: () => null }));
vi.mock('./components/BYOEMobileGate', () => ({
    BYOEMobileGate: ({ children }: { children: ReactNode }) => <>{children}</>,
}));
vi.mock('./components/ErrorPrompt', () => ({ ErrorPrompt: () => null }));

const renderBYOEMobile = () =>
    render(
        <BYOEMobile layout={(children) => children} redirect={undefined} initialSearchParams={new URLSearchParams()} />
    );

describe('BYOEMobile', () => {
    beforeEach(() => {
        mockContext = {
            isLoading: false,
            defaultImportEmails: true,
            limitReached: undefined,
            status: 'idle',
            connectingEmail: undefined,
            startOAuthFlowIfAllowed: mockStartOAuthFlowIfAllowed,
        };
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('Should start the OAuth flow when no limit is reached', () => {
        renderBYOEMobile();

        fireEvent.click(screen.getByRole('button', { name: 'Connect and import' }));

        expect(mockStartOAuthFlowIfAllowed).toHaveBeenCalledWith(true);
        expect(screen.queryByText('paid limit prompt')).not.toBeInTheDocument();
    });

    it('Should open the prompt instead of starting the OAuth flow when a paid user reached the limit', () => {
        mockContext.limitReached = 'paid-limit';
        renderBYOEMobile();

        fireEvent.click(screen.getByRole('button', { name: 'Connect and import' }));

        expect(mockStartOAuthFlowIfAllowed).not.toHaveBeenCalled();
        screen.getByText('paid limit prompt');
    });

    it('Should display the upgrade copy and delegate the click when a free user reached the limit', () => {
        mockContext.limitReached = 'free-limit';
        renderBYOEMobile();

        fireEvent.click(screen.getByRole('button', { name: 'Upgrade to connect' }));

        expect(mockStartOAuthFlowIfAllowed).toHaveBeenCalledWith(true);
        expect(screen.queryByText('paid limit prompt')).not.toBeInTheDocument();
    });
});
