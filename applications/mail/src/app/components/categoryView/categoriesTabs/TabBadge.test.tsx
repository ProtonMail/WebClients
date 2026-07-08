import { render, screen } from '@testing-library/react';

import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { DEFAULT_MAIL_SETTINGS } from '@proton/shared/lib/mail/mailSettings';

import { TabBadge } from './TabBadge';
import { TabState } from './tabsInterface';

jest.mock('@proton/mail/store/mailSettings/hooks');

describe('TabBadge', () => {
    beforeEach(() => {
        jest.mocked(useMailSettings).mockReturnValue([DEFAULT_MAIL_SETTINGS, false]);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('shows the count when shouldShowCounter is true', () => {
        render(<TabBadge count={5} tabState={TabState.INACTIVE} shouldShowCounter={true} />);
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('does not show the count when shouldShowCounter is false', () => {
        render(<TabBadge count={5} tabState={TabState.INACTIVE} shouldShowCounter={false} />);
        expect(screen.queryByText('5')).not.toBeInTheDocument();
    });

    it('caps the displayed count at 999+', () => {
        render(<TabBadge tabState={TabState.INACTIVE} shouldShowCounter={true} count={1500} />);
        expect(screen.getByText('999+')).toBeInTheDocument();
    });
});
