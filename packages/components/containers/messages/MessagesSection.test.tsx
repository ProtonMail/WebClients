import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
    mockUseApi,
    mockUseEventManager,
    mockUseFeature,
    mockUseMailSettings,
    mockUseNotifications,
    mockUseUser,
} from '@proton/testing/index';

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

        mockUseMailSettings();
        mockUseNotifications();
        mockUseFeature();
        mockUseUser();
    });

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
                data: { AlmostAllMail: 1 },
                method: 'put',
                url: 'mail/v4/settings/almost-all-mail',
            });

            await userEvent.click(setting);

            await waitFor(() => {
                expect(mockedApi).toHaveBeenCalledTimes(2);
            });
            expect(mockedApi).toHaveBeenLastCalledWith({
                data: { AlmostAllMail: 0 },
                method: 'put',
                url: 'mail/v4/settings/almost-all-mail',
            });
        });
    });
});
