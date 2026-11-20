import { renderWithProviders } from '@proton/components/testing/vitest/renderWithProviders';

import type { Paths } from '../helper';
import SignInContainer from '../sign-in/SignInContainer';
import LoginModal from './LoginModal';

vi.mock('../sign-in/SignInContainer', () => ({ __esModule: true, default: vi.fn(() => null) }));

describe('LoginModal', () => {
    it("starts its sign-in over when the page's unauthenticated session expires", () => {
        const onSessionExpired = vi.fn(() => () => {});

        renderWithProviders(
            <LoginModal
                open
                onLogin={vi.fn()}
                paths={{} as Paths}
                productParam="generic"
                onStartAuth={() => Promise.resolve()}
                onSessionExpired={onSessionExpired}
            />
        );

        expect(vi.mocked(SignInContainer).mock.calls.map(([props]) => props)).toContainEqual(
            expect.objectContaining({ onSessionExpired })
        );
    });
});
