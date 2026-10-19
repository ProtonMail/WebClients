import { fireEvent, render, screen } from '@testing-library/react';

import { BYOEMobile } from './BYOEMobile';

const mockStartOAuthFlowIfAllowed = jest.fn();
let mockContext: any;
jest.mock('./context/BYOEMobileProvider', () => ({
    BYOEMobileProvider: ({ children }: any) => <>{children}</>,
    useBYOEMobile: () => mockContext,
}));

jest.mock('@proton/activation/src/logic/EasySwitchStoreInitializer', () => ({
    __esModule: true,
    default: ({ children }: any) => <>{children}</>,
}));
jest.mock('@proton/activation/src/logic/StoreProvider', () => ({
    __esModule: true,
    default: ({ children }: any) => <>{children}</>,
}));
jest.mock('@proton/activation/src/components/Modals/ReachedLimitForwardingModal/ReachedLimitForwardingModal', () => ({
    __esModule: true,
    default: () => <div>paid limit prompt</div>,
}));
jest.mock('./components/BYOEMobileConnections/BYOEMobileConnections', () => ({ BYOEMobileConnections: () => null }));
jest.mock('./components/ErrorPrompt', () => ({ ErrorPrompt: () => null }));

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
        jest.clearAllMocks();
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
