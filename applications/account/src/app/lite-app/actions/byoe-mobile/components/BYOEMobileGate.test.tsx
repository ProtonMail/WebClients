import { fireEvent, render, screen } from '@testing-library/react';

import { BYOEMobileGate } from './BYOEMobileGate';

let mockIsLoadingGating = true;
let mockFlagsReady = false;
let mockFlagsError: unknown;
const mockDispatch = jest.fn();
let mockSyncListState = 'pending';

jest.mock('@proton/activation/src/byoe/useBYOEGating', () => ({
    useBYOEGating: () => ({ isLoadingGating: mockIsLoadingGating }),
}));
jest.mock('@unleash/proxy-client-react', () => ({
    useFlagsStatus: () => ({ flagsReady: mockFlagsReady, flagsError: mockFlagsError }),
}));
jest.mock('@proton/activation/src/logic/store', () => ({
    useEasySwitchDispatch: () => mockDispatch,
    useEasySwitchSelector: () => mockSyncListState,
}));
jest.mock('@proton/activation/src/logic/sync/sync.actions', () => ({ loadSyncList: () => ({ type: 'loadSyncList' }) }));
jest.mock('@proton/activation/src/logic/sync/sync.selectors', () => ({ selectSyncListLoadingState: jest.fn() }));

const renderGate = () =>
    render(
        <BYOEMobileGate>
            <div>content</div>
        </BYOEMobileGate>
    );

describe('BYOEMobileGate', () => {
    beforeEach(() => {
        mockIsLoadingGating = true;
        mockFlagsReady = false;
        mockFlagsError = undefined;
        mockDispatch.mockClear();
        mockSyncListState = 'pending';
    });

    it('Should hide the content while the gating data is loading', () => {
        mockFlagsReady = true;
        renderGate();
        expect(screen.queryByText('content')).not.toBeInTheDocument();
    });

    it('Should hide the content until the feature flags are ready', () => {
        mockIsLoadingGating = false;
        renderGate();
        expect(screen.queryByText('content')).not.toBeInTheDocument();
    });

    it('Should show the content once everything is ready, and keep it when loading restarts', () => {
        mockIsLoadingGating = false;
        mockFlagsReady = true;
        const { rerender } = renderGate();
        screen.getByText('content');

        mockIsLoadingGating = true;
        rerender(
            <BYOEMobileGate>
                <div>content</div>
            </BYOEMobileGate>
        );
        screen.getByText('content');
    });

    it('Should offer a retry when the forwardings failed to load', () => {
        mockSyncListState = 'failed';
        renderGate();
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'loadSyncList' });
    });

    it('Should show the content when the feature flags failed to load', () => {
        mockIsLoadingGating = false;
        mockFlagsError = new Error('network');
        renderGate();
        screen.getByText('content');
    });
});
