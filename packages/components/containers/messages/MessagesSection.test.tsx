import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ALMOST_ALL_MAIL, VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';
import {
    mockUseApi,
    mockUseEventManager,
    mockUseFeature,
    mockUseFlag,
    mockUseMailSettings,
    mockUseNotifications,
    mockUseUser,
} from '@proton/testing';

import { FeatureCode } from '../features';
import MessagesSection from './MessagesSection';

describe('MessagesSection', () => {
    let mockedApi: jest.Mock;
    let mockedCall: jest.Mock;

    beforeEach(() => {
        mockedApi = jest.fn();
        mockedCall = jest.fn();

        mockUseApi(mockedApi);
        mockUseEventManager({ call: mockedCall });

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
                mockUseFeature().mockImplementation((code) => {
                    if (code === FeatureCode.AlmostAllMail) {
                        return { feature: { Value: false } } as any;
                    }

                    return { feature: { Value: true } } as any;
                });

                render(<MessagesSection />);

                expect(screen.queryByText('Exclude Spam/Trash from All mail')).not.toBeInTheDocument();
            });
        });

        describe('when AlmostAllMail is  enabled', () => {
            beforeEach(() => {
                mockUseFeature({ feature: { Value: true } });
            });

            it('should render AlmostAllMail toggle', () => {
                render(<MessagesSection />);

                expect(screen.getByText('Exclude Spam/Trash from All mail')).toBeInTheDocument();
            });

            it('should toggle setting on click', async () => {
                render(<MessagesSection />);

                const setting = screen.getByText('Exclude Spam/Trash from All mail');
                await userEvent.click(setting);

                await waitFor(() => {
                    expect(mockedApi).toHaveBeenCalledTimes(1);
                });
                expect(mockedApi).toHaveBeenCalledWith({
                    data: { AlmostAllMail: ALMOST_ALL_MAIL.ENABLED },
                    method: 'put',
                    url: 'mail/v4/settings/almost-all-mail',
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

        describe('when PageSize selection is disabled', () => {
            beforeEach(() => {
                mockUseFlag().mockImplementation((code) => {
                    return code !== 'WebMailPageSizeSetting';
                });
            });

            it('should not display selector', () => {
                render(<MessagesSection />);
                expect(screen.queryByText(/Messages per page/)).not.toBeInTheDocument();
                expect(screen.queryByText(/Conversations per page/)).not.toBeInTheDocument();
            });
        });

        describe('when PageSize selection is enabled', () => {
            it('should display correct label', () => {
                render(<MessagesSection />);
                expect(screen.getByText(/Messages per page/));
            });

            describe('when user is in grouped messages mode', () => {
                beforeEach(() => {
                    mockUseMailSettings([{ ViewMode: VIEW_MODE.GROUP }]);
                });

                it('should display correct label', () => {
                    render(<MessagesSection />);

                    expect(screen.getByText(/Conversations per page/));
                });
            });

            describe('when user clicks on an option', () => {
                const mockedApi = jest.fn();
                const mockedCall = jest.fn();
                const mockedCreateNotification = jest.fn();

                beforeEach(() => {
                    mockUseApi(mockedApi);
                    mockUseEventManager({ call: mockedCall });
                    mockUseNotifications({ createNotification: mockedCreateNotification });
                });

                it('should display correct label', async () => {
                    render(<MessagesSection />);

                    const select = screen.getByTestId('page-size-selector');
                    await userEvent.click(select);

                    const option2 = screen.getByRole('button', { name: /100/ });
                    await userEvent.click(option2);

                    await waitFor(() => {
                        expect(mockedApi).toHaveBeenCalledTimes(1);
                    });

                    expect(mockedApi).toHaveBeenCalledWith({
                        data: { PageSize: 100 },
                        method: 'put',
                        url: 'mail/v4/settings/pagesize',
                    });

                    expect(mockedCall).toHaveBeenCalledTimes(1);

                    expect(mockedCreateNotification).toHaveBeenCalledTimes(1);
                    expect(mockedCreateNotification).toHaveBeenCalledWith({ text: 'Preference saved' });
                });
            });
        });
    });
});
