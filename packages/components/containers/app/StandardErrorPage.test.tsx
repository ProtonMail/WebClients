import React from 'react';

import { render, screen } from '@testing-library/react';

import useDocumentTitle from '@proton/components/hooks/useDocumentTitle';
import metrics from '@proton/metrics';
import { FlagContext } from '@proton/unleash';

import StandardErrorPage from './StandardErrorPage';

jest.mock('@proton/components/hooks/useDocumentTitle');
jest.mock('@proton/metrics', () => ({
    core_ui_blocking_error_page_total: {
        increment: jest.fn(),
    },
}));

jest.mock('react', () => {
    const originalReact = jest.requireActual('react');
    return {
        ...originalReact,
        useContext: jest.fn().mockImplementation((context) => {
            if (context === FlagContext) {
                return true;
            }
            return originalReact.useContext(context);
        }),
    };
});

describe('StandardErrorPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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
    });
});
