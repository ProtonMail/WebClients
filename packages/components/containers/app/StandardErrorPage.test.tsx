import { render, screen } from '@testing-library/react';
import { FlagContext } from '@unleash/proxy-client-react';

import metrics from '@proton/metrics/metricsInstance';

import useDocumentTitle from '../../hooks/useDocumentTitle';
import StandardErrorPage from './StandardErrorPage';

vi.mock('../../hooks/useDocumentTitle');
vi.mock('@proton/metrics/metricsInstance', () => ({
    default: {
        core_ui_blocking_error_page_total: {
            increment: vi.fn(),
        },
    },
}));

vi.mock('react', async () => {
    const originalReact = await vi.importActual<any>('react');
    return {
        ...originalReact,
        useContext: vi.fn().mockImplementation((context) => {
            if (context === FlagContext) {
                return true;
            }
            return originalReact.useContext(context);
        }),
    };
});

describe('StandardErrorPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders GenericError component with children', () => {
        const testMessage = 'Test error message';
        render(
            <StandardErrorPage>
                <span>{testMessage}</span>
            </StandardErrorPage>
        );

        const genericError = screen.getByTestId('generic-error');
        expect(genericError).toBeInTheDocument();
        expect(screen.getByText(testMessage)).toBeInTheDocument();
    });

    it('sets document title', () => {
        render(<StandardErrorPage />);

        expect(useDocumentTitle).toHaveBeenCalledWith('Oops, something went wrong');
    });

    it('increments metrics counter on mount', () => {
        render(<StandardErrorPage />);

        expect(metrics.core_ui_blocking_error_page_total.increment).toHaveBeenCalledWith({});
        expect(metrics.core_ui_blocking_error_page_total.increment).toHaveBeenCalledTimes(1);
    });
});
