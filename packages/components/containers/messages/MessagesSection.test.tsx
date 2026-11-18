import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { mockUseUser } from '@proton/account/testing/vitest/mockUseUser';
import { mockUseApi } from '@proton/app-context/testing/vitest/mockUseApi';
import { mockUseNotifications } from '@proton/app-context/testing/vitest/mockUseNotifications';
import { FeatureCode } from '@proton/features/interface';
import { mockUseFeature } from '@proton/features/testing/vitest/mockUseFeature';
import { ALMOST_ALL_MAIL, VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { mockUseMailSettings } from '../../testing/vitest/mockUseMailSettings';
import { renderWithProviders } from '../../testing/vitest/renderWithProviders';
import MessagesSection from './MessagesSection';

describe('MessagesSection', () => {
    let mockedApi: Mock;

    const renderComponent = (props = {}) => renderWithProviders(<MessagesSection {...props} />);

    beforeEach(() => {
        mockedApi = vi.fn();

        mockUseApi(mockedApi);

        mockUseNotifications();

        mockUseUser();
        mockUseMailSettings();
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
                renderComponent();

                const setting = screen.getByText('Exclude Spam/Trash from All mail');
                mockedApi.mockResolvedValue({
                    MailSettings: {
                        AlmostAllMail: ALMOST_ALL_MAIL.ENABLED,
                    },
                });

                await userEvent.click(setting);
                await waitFor(() => {
                    expect(mockedApi).toHaveBeenCalledTimes(1);
                });
                expect(mockedApi).toHaveBeenCalledWith({
                    data: { AlmostAllMail: ALMOST_ALL_MAIL.ENABLED },
                    method: 'put',
                    url: 'mail/v4/settings/almost-all-mail',
                });

                mockedApi.mockResolvedValue({
                    MailSettings: {
                        AlmostAllMail: ALMOST_ALL_MAIL.DISABLED,
                    },
                });

                await userEvent.click(setting);
                await waitFor(() => {
                    expect(mockedApi).toHaveBeenCalledTimes(2);
                });
                expect(mockedApi).toHaveBeenLastCalledWith({
                    data: { AlmostAllMail: ALMOST_ALL_MAIL.DISABLED },
                    method: 'put',
                    url: 'mail/v4/settings/almost-all-mail',
                });
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
