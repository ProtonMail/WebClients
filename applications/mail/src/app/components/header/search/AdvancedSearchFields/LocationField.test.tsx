import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { getModelState } from '@proton/account/test';
import { renderWithProviders } from '@proton/components/containers/contacts/tests/render';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import { ALMOST_ALL_MAIL } from '@proton/shared/lib/mail/mailSettings';
import { mockUseFolders } from '@proton/testing';

import LocationField from './LocationField';
import { mockUseLocationFieldOptions } from './LocationField.test.utils';

describe('LocationField', () => {
    beforeEach(() => {
        mockUseLocationFieldOptions();
        mockUseFolders();
    });

    it('should correctly render main locations buttons', () => {
        renderWithProviders(<LocationField value={MAILBOX_LABEL_IDS.ALL_MAIL} onChange={jest.fn()} />);

        expect(screen.getByText('Search in'));

        const allMailButton = screen.getByRole('button', { name: 'Search in All mail' });
        expect(allMailButton).toBeInTheDocument();
        expect(allMailButton).toHaveClass('button-solid-norm');

        expect(screen.getByRole('button', { name: 'Search in Inbox' }));
        expect(screen.getByRole('button', { name: 'Search in Drafts' }));
        expect(screen.getByRole('button', { name: 'Search in Sent' }));
        expect(screen.getByRole('button', { name: 'Other' }));
    });

    describe('when user click on another location', () => {
        it('should correctly change location', async () => {
            const onChange = jest.fn();
            renderWithProviders(<LocationField value={MAILBOX_LABEL_IDS.INBOX} onChange={onChange} />);

            const draftsButton = screen.getByRole('button', { name: 'Search in Drafts' });
            await userEvent.click(draftsButton);

            await waitFor(() => {
                expect(onChange).toHaveBeenCalledTimes(1);
            });

            expect(onChange).toHaveBeenCalledWith(MAILBOX_LABEL_IDS.DRAFTS);
        });
    });

    describe('when user click on Other button', () => {
        it('should correctly change location', async () => {
            const onChange = jest.fn();
            renderWithProviders(<LocationField value={MAILBOX_LABEL_IDS.INBOX} onChange={onChange} />);

            const otherButton = screen.getByRole('button', { name: 'Other' });
            await userEvent.click(otherButton);

            await waitFor(() => {
                expect(screen.getByText('Labels')).toBeInTheDocument();
            });

            const customLabelButton = screen.getByRole('button', { name: 'Highlighted' });
            await userEvent.click(customLabelButton);

            await waitFor(() => {
                expect(onChange).toHaveBeenCalledTimes(1);
            });

            expect(onChange).toHaveBeenCalledWith('36');
        });
    });

    describe('when custom option is set', () => {
        it('should correctly change location', async () => {
            const onChange = jest.fn();
            renderWithProviders(<LocationField value={'36'} onChange={onChange} />);

            expect(screen.getByText('Highlighted')).toBeInTheDocument();
            const customLabelButton = screen.getByRole('button', { name: 'Remove' });
            expect(customLabelButton).toBeInTheDocument();
            expect(customLabelButton).toHaveClass('button-solid-norm');

            await userEvent.click(customLabelButton);

            await waitFor(() => {
                expect(onChange).toHaveBeenCalledTimes(1);
            });

            expect(onChange).toHaveBeenCalledWith(MAILBOX_LABEL_IDS.ALL_MAIL);
        });

        describe('when Almost All Mail is set', () => {
            it('should correctly change location', async () => {
                const onChange = jest.fn();
                renderWithProviders(<LocationField value={'36'} onChange={onChange} />, {
                    preloadedState: {
                        mailSettings: getModelState({ AlmostAllMail: ALMOST_ALL_MAIL.ENABLED } as MailSettings),
                    },
                });

                expect(screen.getByText('Highlighted')).toBeInTheDocument();
                const customLabelButton = screen.getByRole('button', { name: 'Remove' });
                expect(customLabelButton).toBeInTheDocument();
                expect(customLabelButton).toHaveClass('button-solid-norm');

                await userEvent.click(customLabelButton);

                await waitFor(() => {
                    expect(onChange).toHaveBeenCalledTimes(1);
                });

                expect(onChange).toHaveBeenCalledWith(MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL);
            });
        });
    });
});
