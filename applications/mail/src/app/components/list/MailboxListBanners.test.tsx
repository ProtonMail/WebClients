import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { mockUseUser } from '@proton/account/testing/mockUseUser';
import { mockUseApi } from '@proton/app-context/testing/mockUseApi';
import { mockUseHistory } from '@proton/components/testing/mockUseHistory';
import { DENSITY, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { UserSettings } from '@proton/shared/lib/interfaces/UserSettings';

import { mockUseEncryptedSearchContext } from '../../helpers/tests/mockUseEncryptedSearchContext';
import { mailTestRender } from '../../helpers/tests/render';
import { useMailSelector } from '../../store/hooks';
import MailboxListBanners from './MailboxListBanners';
import { mockUseAutoDeleteBanner, mockUseShowUpsellBanner } from './MailboxListBanners.test.utils';

vi.mock('../../hooks/useShowUpsellBanner', () => ({
    __esModule: true,
    default: vi.fn(),
}));

vi.mock('./banners/auto-delete/useAutodeleteBanner', () => ({
    __esModule: true,
    default: vi.fn(),
}));

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

vi.mock('../../store/hooks', async () => ({
    ...(await vi.importActual('../../store/hooks')),
    useMailSelector: vi.fn().mockReturnValue(vi.fn()),
}));
const useMailSelectorMock = useMailSelector as Mock;

describe('ListBanners', () => {
    beforeEach(() => {
        mockUseEncryptedSearchContext();
        mockUseAutoDeleteBanner();
        mockUseShowUpsellBanner();
        mockUseUser();
        useMailSelectorMock.mockReturnValue(false);
    });

    it('should display no banner', async () => {
        await mailTestRender(<MailboxListBanners {...baseProps} />);
        expect(screen.queryByText(/\w/)).not.toBeInTheDocument();
    });

    describe('when showESSlowToolbar is true', () => {
        const mockedOpenDropdown = vi.fn();
        const mockedSetTemporaryToggleOff = vi.fn();

        beforeEach(() => {
            mockUseEncryptedSearchContext({
                openDropdown: mockedOpenDropdown,
                setTemporaryToggleOff: mockedSetTemporaryToggleOff,
            });
        });

        it('should display es slow banner', async () => {
            await mailTestRender(
                <MailboxListBanners
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
        const mockedPush = vi.fn();
        beforeEach(() => {
            mockUseHistory({ push: mockedPush });
        });

        it('should display almost all mail banner', async () => {
            await mailTestRender(
                <MailboxListBanners
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
            vi.spyOn(global.Math, 'random').mockReturnValue(0.349);
        });

        it('should render upsell banner', async () => {
            await mailTestRender(<MailboxListBanners {...baseProps} />);

            expect(screen.getByText(/Use keyboard shortcuts to manage your email faster./i)).toBeInTheDocument();
            expect(screen.getByText(/Learn more/i)).toBeInTheDocument();
        });
    });

    describe('when canDisplayTaskRunningBanner is true', () => {
        it('should display task running banner', async () => {
            useMailSelectorMock.mockReturnValue(true);
            await mailTestRender(<MailboxListBanners {...baseProps} canDisplayTaskRunningBanner={true} />);
            expect(screen.getByText(/Message actions in progress. This may take a while./i)).toBeInTheDocument();
        });
    });

    describe('when condition for auto delete is true', () => {
        let mockedApi: Mock;

        beforeEach(() => {
            mockedApi = vi.fn();
            mockUseApi(mockedApi);
            mockUseAutoDeleteBanner('paid-banner');
        });

        it('should display auto delete banner', async () => {
            await mailTestRender(<MailboxListBanners {...baseProps} labelID={MAILBOX_LABEL_IDS.TRASH} />);
            expect(
                screen.getByText(
                    /Automatically delete messages that have been in trash and spam for more than 30 days./i
                )
            ).toBeInTheDocument();
        });
    });
});
