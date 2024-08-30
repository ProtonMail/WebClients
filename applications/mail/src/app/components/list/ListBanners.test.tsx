import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DENSITY, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import { mockUseApi, mockUseEventManager, mockUseHistory, mockUseUser } from '@proton/testing';

import { mockUseEncryptedSearchContext } from 'proton-mail/helpers/test/mockUseEncryptedSearchContext';
import { useMailSelector } from 'proton-mail/store/hooks';

import ListBanners from './ListBanners';
import { mockUseAutoDeleteBanner, mockUseShowUpsellBanner } from './ListBanners.test.utils';

const baseProps = {
    labelID: MAILBOX_LABEL_IDS.INBOX,
    columnLayout: false,
    userSettings: { Density: DENSITY.COMFORTABLE } as UserSettings,
    esState: {
        isESLoading: false,
        isSearch: false,
        showESSlowToolbar: false,
    },
    selectedCount: 0,
    canDisplayTaskRunningBanner: false,
};

jest.mock('proton-mail/store/hooks', () => ({
    useMailSelector: jest.fn().mockReturnValue(jest.fn()),
}));
const useMailSelectorMock = useMailSelector as jest.Mock;

describe('ListBanners', () => {
    beforeEach(() => {
        mockUseEncryptedSearchContext();
        mockUseAutoDeleteBanner();
        mockUseShowUpsellBanner();
        mockUseUser();
        useMailSelectorMock.mockReturnValue(false);
    });

    it('should display no banner', () => {
        const { container } = render(<ListBanners {...baseProps} />);

        expect(container).toBeEmptyDOMElement();
    });

    describe('when showESSlowToolbar is true', () => {
        let mockedOpenDropdown = jest.fn();
        let mockedSetTemporaryToggleOff = jest.fn();

        beforeEach(() => {
            mockUseEncryptedSearchContext({
                openDropdown: mockedOpenDropdown,
                setTemporaryToggleOff: mockedSetTemporaryToggleOff,
            });
        });

        it('should display es slow banner', async () => {
            render(
                <ListBanners
                    {...baseProps}
                    esState={{
                        isESLoading: false,
                        isSearch: false,
                        showESSlowToolbar: true,
                    }}
                />
            );

            expect(screen.getByText(/Search taking too long\?/i)).toBeInTheDocument();

            const refineButton = screen.getByRole('button', { name: /Refine it/ });
            await userEvent.click(refineButton);
            await waitFor(() => {
                expect(mockedOpenDropdown).toHaveBeenCalledTimes(1);
            });

            const excludeButton = screen.getByRole('button', { name: /exclude message content/ });
            await userEvent.click(excludeButton);
            await waitFor(() => {
                expect(mockedSetTemporaryToggleOff).toHaveBeenCalledTimes(1);
            });

            expect(screen.getByText(/from this search session./i)).toBeInTheDocument();
        });
    });

    describe('when user is in almost all mail and using es', () => {
        const mockedPush = jest.fn();
        beforeEach(() => {
            mockUseHistory({ push: mockedPush });
        });

        it('should display almost all mail banner', async () => {
            render(
                <ListBanners
                    {...baseProps}
                    labelID={MAILBOX_LABEL_IDS.ALMOST_ALL_MAIL}
                    esState={{
                        isESLoading: false,
                        isSearch: false,
                        showESSlowToolbar: false,
                    }}
                />
            );

            expect(screen.getByText(/Can't find what you're looking for\?/i)).toBeInTheDocument();
            const includeButton = screen.getByRole('button', { name: /Include Spam\/Trash/i });
            await userEvent.click(includeButton);
            await waitFor(() => {
                expect(mockedPush).toHaveBeenCalledTimes(1);
            });

            expect(mockedPush).toHaveBeenCalledWith('/all-mail');
        });
    });

    describe('when canDisplayUpsellBanner is true', () => {
        beforeEach(() => {
            mockUseShowUpsellBanner({ canDisplayUpsellBanner: true });
            jest.spyOn(global.Math, 'random').mockReturnValue(0.349);
        });

        it('should render upsell banner', () => {
            render(<ListBanners {...baseProps} />);

            expect(screen.getByText(/Use keyboard shortcuts to manage your email faster./i)).toBeInTheDocument();
            expect(screen.getByText(/Learn more/i)).toBeInTheDocument();
        });
    });

    describe('when canDisplayTaskRunningBanner is true', () => {
        it('should display task running banner', async () => {
            useMailSelectorMock.mockReturnValue(true);
            render(<ListBanners {...baseProps} canDisplayTaskRunningBanner={true} />);
            expect(screen.getByText(/Message actions in progress. This may take a while./i)).toBeInTheDocument();
        });
    });

    describe('when condition for auto delete is true', () => {
        beforeEach(() => {
            mockUseApi();
            mockUseEventManager();
            mockUseAutoDeleteBanner('paid-banner');
        });

        it('should display auto delete banner', () => {
            render(<ListBanners {...baseProps} labelID={MAILBOX_LABEL_IDS.TRASH} />);
            expect(
                screen.getByText(
                    /Automatically delete messages that have been in trash and spam for more than 30 days./i
                )
            ).toBeInTheDocument();
        });
    });
});
