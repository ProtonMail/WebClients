import { render } from '@testing-library/react';

import ModalsProvider from '@proton/components/containers/modals/Provider';

import TogglingMonitoringModal from './TogglingMonitoringModal';

// Mocked so that the modal renders in the same container
jest.mock('react-dom', () => ({
    ...jest.requireActual('react-dom'),
    createPortal: (node: any) => node,
}));

describe('TogglingMonitoringModal component', () => {
    it('does not render if not open', () => {
        const { baseElement } = render(
            <ModalsProvider>
                <TogglingMonitoringModal enabling={true} data-testid="toggle-prompt" />
            </ModalsProvider>
        );

        expect(baseElement.querySelector('[data-testid="toggle-prompt"]')).toBe(null);
    });

    it('renders when enabled', () => {
        const { baseElement } = render(
            <ModalsProvider>
                <TogglingMonitoringModal open={true} enabling={true} data-testid="toggle-prompt" />
            </ModalsProvider>
        );
        const header = baseElement.querySelector('[data-testid="toggle-prompt"]');

        expect(header).toHaveTextContent(/Gateway monitor enabled/);

        const body = baseElement.querySelector('.modal-two-content');

        expect(body).toHaveTextContent(/Connection data will be available in around 1 hour./);
    });

    it('renders when disabled', () => {
        const { baseElement } = render(
            <ModalsProvider>
                <TogglingMonitoringModal open={true} enabling={false} data-testid="toggle-prompt" />
            </ModalsProvider>
        );
        const header = baseElement.querySelector('[data-testid="toggle-prompt"]');

        expect(header).toHaveTextContent(/Gateway monitor disabled/);

        const body = baseElement.querySelector('.modal-two-content');

        expect(body).toHaveTextContent(/New VPN connection data will stop being collected and shown./);
    });
});
