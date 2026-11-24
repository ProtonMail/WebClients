import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { mockUseUser } from '@proton/account/testing/mockUseUser';
import { mockUseNotifications } from '@proton/app-context/testing/mockUseNotifications';
import { FeatureCode } from '@proton/features/interface';
import { mockUseFeature } from '@proton/features/testing/mockUseFeature';
import { ALMOST_ALL_MAIL, VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';
import { addApiMock, clearApiMocks } from '@proton/test-api/vitest/api';

import { mockUseMailSettings } from '../../testing/mockUseMailSettings';
import { renderWithProviders } from '../../testing/renderWithProviders';
import MessagesSection from './MessagesSection';

describe('MessagesSection', () => {
    const renderComponent = (props = {}) => renderWithProviders(<MessagesSection {...props} />);

    beforeEach(() => {
        mockUseNotifications();

        mockUseUser();
        mockUseMailSettings();
    });

    afterEach(() => {
        clearApiMocks();
    });

    describe('AlmostAllMail', () => {
        describe('when AlmostAllMail is not enabled', () => {
            it('should not render AlmostAllMail toggle', () => {
                mockUseFeature().mockImplementation((code) => {
                    if (code === FeatureCode.AlmostAllMail) {
                        return { feature: { Value: false } } as any;
                    }

                    return { feature: { Value: true } } as any;
                });

                renderComponent();

                expect(screen.queryByText('Exclude Spam/Trash from All mail')).not.toBeInTheDocument();
            });
        });

        describe('when AlmostAllMail is  enabled', () => {
            beforeEach(() => {
                mockUseFeature({ feature: { Value: true } });
            });

            it('should render AlmostAllMail toggle', () => {
                renderComponent();

                expect(screen.getByText('Exclude Spam/Trash from All mail')).toBeInTheDocument();
            });

            it('should toggle setting on click', async () => {
                const updateAlmostAllMail = vi.fn();
                addApiMock('mail/v4/settings/almost-all-mail', updateAlmostAllMail, 'put');
                const { rerender } = renderComponent();

                const setting = screen.getByText('Exclude Spam/Trash from All mail');
                updateAlmostAllMail.mockReturnValue({ MailSettings: { AlmostAllMail: ALMOST_ALL_MAIL.ENABLED } });

                await userEvent.click(setting);
                await waitFor(() => {
                    expect(updateAlmostAllMail).toHaveBeenCalledTimes(1);
                });
                expect(updateAlmostAllMail).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: { AlmostAllMail: ALMOST_ALL_MAIL.ENABLED },
                        method: 'put',
                        url: 'mail/v4/settings/almost-all-mail',
                    })
                );

                // The settings are mocked: render again with the value the store would hold after the update
                mockUseMailSettings([{ AlmostAllMail: ALMOST_ALL_MAIL.ENABLED }]);
                rerender(<MessagesSection />);

                updateAlmostAllMail.mockReturnValue({ MailSettings: { AlmostAllMail: ALMOST_ALL_MAIL.DISABLED } });

                await userEvent.click(setting);
                await waitFor(() => {
                    expect(updateAlmostAllMail).toHaveBeenCalledTimes(2);
                });
                expect(updateAlmostAllMail).toHaveBeenLastCalledWith(
                    expect.objectContaining({
                        data: { AlmostAllMail: ALMOST_ALL_MAIL.DISABLED },
                        method: 'put',
                        url: 'mail/v4/settings/almost-all-mail',
                    })
                );
            });
        });
    });

    describe('PageSize', () => {
        beforeEach(() => {
            mockUseFeature({ feature: { Value: true } });
            mockUseMailSettings([{ ViewMode: VIEW_MODE.SINGLE }]);
        });

        it('should display correct label', () => {
            renderComponent();
            expect(screen.getByText(/Messages per page/)).toBeInTheDocument();
        });

        describe('when user is in grouped messages mode', () => {
            beforeEach(() => {
                mockUseMailSettings([{ ViewMode: VIEW_MODE.GROUP }]);
            });

            it('should display correct label', () => {
                renderComponent();

                expect(screen.getByText(/Conversations per page/)).toBeInTheDocument();
            });
        });
    });
});
