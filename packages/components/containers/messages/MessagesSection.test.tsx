import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { FeatureCode } from '@proton/features';
import { ALMOST_ALL_MAIL, VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';
import { mockUseFlag, renderWithProviders } from '@proton/testing';
import { mockUseApi } from '@proton/testing/lib/mockUseApi';
import { mockUseFeatureBarrel } from '@proton/testing/lib/mockUseFeatureBarrel';
import { mockUseMailSettings } from '@proton/testing/lib/mockUseMailSettings';
import { mockUseNotifications } from '@proton/testing/lib/mockUseNotifications';
import { mockUseUser } from '@proton/testing/lib/mockUseUser';

import MessagesSection from './MessagesSection';

describe('MessagesSection', () => {
    let mockedApi: jest.Mock;

    const renderComponent = (props = {}) => renderWithProviders(<MessagesSection {...props} />);

    beforeEach(() => {
        mockedApi = jest.fn();

        mockUseApi(mockedApi);

        mockUseNotifications();

        mockUseFlag().mockImplementation((code) => {
            return code === 'WebMailPageSizeSetting';
        });

        mockUseUser();
        mockUseMailSettings();
    });

    describe('AlmostAllMail', () => {
        describe('when AlmostAllMail is not enabled', () => {
            it('should not render AlmostAllMail toggle', () => {
                mockUseFeatureBarrel().mockImplementation((code) => {
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
                mockUseFeatureBarrel({ feature: { Value: true } });
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
            mockUseFeatureBarrel({ feature: { Value: true } });
            mockUseMailSettings([{ ViewMode: VIEW_MODE.SINGLE }]);
        });

        describe('when PageSize selection is disabled', () => {
            beforeEach(() => {
                mockUseFlag().mockImplementation((code) => {
                    return code !== 'WebMailPageSizeSetting';
                });
            });

            it('should not display selector', () => {
                renderComponent();
                expect(screen.queryByText(/Messages per page/)).not.toBeInTheDocument();
                expect(screen.queryByText(/Conversations per page/)).not.toBeInTheDocument();
            });
        });

        describe('when PageSize selection is enabled', () => {
            it('should display correct label', () => {
                renderComponent();
                expect(screen.getByText(/Messages per page/));
            });

            describe('when user is in grouped messages mode', () => {
                beforeEach(() => {
                    mockUseMailSettings([{ ViewMode: VIEW_MODE.GROUP }]);
                });

                it('should display correct label', () => {
                    renderComponent();

                    expect(screen.getByText(/Conversations per page/));
                });
            });
        });
    });
});
