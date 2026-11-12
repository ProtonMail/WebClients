import { renderWithProviders } from '@proton/components/testing/renderWithProviders';

import type { Paths } from '../helper';
import SignInContainer from '../sign-in/SignInContainer';
import LoginModal from './LoginModal';

jest.mock('../sign-in/SignInContainer', () => ({ __esModule: true, default: jest.fn(() => null) }));

describe('LoginModal', () => {
    it("starts its sign-in over when the page's unauthenticated session expires", () => {
        const onSessionExpired = jest.fn(() => () => {});

        renderWithProviders(
            <LoginModal
                open
                onLogin={jest.fn()}
                paths={{} as Paths}
                productParam="generic"
                onStartAuth={() => Promise.resolve()}
                onSessionExpired={onSessionExpired}
            />
        );

        expect(jest.mocked(SignInContainer)).toHaveBeenCalledWith(
            expect.objectContaining({ onSessionExpired }),
            expect.anything()
        );
    });
});
