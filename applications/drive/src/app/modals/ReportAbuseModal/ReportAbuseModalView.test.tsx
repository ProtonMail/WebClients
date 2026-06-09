import React from 'react';

import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NodeType } from '@proton/drive';
import { renderWithProviders } from '@proton/testing/lib/context/renderWithProviders';

import { ReportAbuseModalView } from './ReportAbuseModalView';
import { AbuseCategoryType } from './types';

const baseLoadedProps = {
    loaded: true as const,
    open: true,
    onClose: jest.fn(),
    onExit: jest.fn(),
    handleSubmit: jest.fn().mockResolvedValue(undefined),
    name: 'file.pdf',
    size: 1024,
    mediaType: 'application/pdf',
    type: NodeType.File,
};

// Buttons are inside a dialog which is marked aria-hidden when "behind backdrop".
// Using { hidden: true } lets us query those elements anyway.
const getButton = (name: string) => screen.getByRole('button', { name, hidden: true });
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const getForm = () => getButton('Submit').closest('form')!;

describe('ReportAbuseModalView', () => {
    afterEach(() => jest.clearAllMocks());

    it('shows a loading state when not loaded', () => {
        renderWithProviders(<ReportAbuseModalView loaded={false} />);
        expect(screen.getAllByText('Loading').length).toBeGreaterThan(0);
    });

    it('renders the file name and the submit button when loaded', () => {
        renderWithProviders(<ReportAbuseModalView {...baseLoadedProps} />);
        expect(screen.getAllByText('file.pdf').length).toBeGreaterThan(0);
        expect(getButton('Submit')).toBeInTheDocument();
    });

    it('pre-fills form fields from prefilled prop', () => {
        renderWithProviders(
            <ReportAbuseModalView
                {...baseLoadedProps}
                prefilled={{ email: 'test@example.com', comment: 'bad content' }}
            />
        );
        expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
        expect(screen.getByDisplayValue('bad content')).toBeInTheDocument();
    });

    it('does not require email or comment for categories without email verification', async () => {
        renderWithProviders(
            <ReportAbuseModalView {...baseLoadedProps} prefilled={{ category: AbuseCategoryType.Spam }} />
        );

        fireEvent.submit(getForm());

        await waitFor(() => {
            expect(baseLoadedProps.handleSubmit).toHaveBeenCalledWith({
                category: AbuseCategoryType.Spam,
                email: undefined,
                comment: undefined,
            });
        });
    });

    it('requires email and comment for Copyright category', async () => {
        renderWithProviders(
            <ReportAbuseModalView {...baseLoadedProps} prefilled={{ category: AbuseCategoryType.Copyright }} />
        );

        fireEvent.submit(getForm());

        await waitFor(() => {
            expect(baseLoadedProps.handleSubmit).not.toHaveBeenCalled();
        });
    });

    it('submits with email and comment when Copyright category is selected and fields are filled', async () => {
        renderWithProviders(
            <ReportAbuseModalView
                {...baseLoadedProps}
                prefilled={{ category: AbuseCategoryType.Copyright, email: 'a@b.com', comment: 'details' }}
            />
        );

        fireEvent.submit(getForm());

        await waitFor(() => {
            expect(baseLoadedProps.handleSubmit).toHaveBeenCalledWith({
                category: AbuseCategoryType.Copyright,
                email: 'a@b.com',
                comment: 'details',
            });
        });
    });

    it('calls onClose when Cancel is clicked', async () => {
        renderWithProviders(<ReportAbuseModalView {...baseLoadedProps} />);
        await userEvent.click(getButton('Cancel'));
        expect(baseLoadedProps.onClose).toHaveBeenCalled();
    });
});
