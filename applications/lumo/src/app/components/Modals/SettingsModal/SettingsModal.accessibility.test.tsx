import { MemoryRouter } from 'react-router-dom';

import { render, screen } from '@testing-library/react';

import { ModalPositionsProvider } from '@proton/components/components/modalTwo/modalPositions';

import SettingsModal from './SettingsModal';

vi.mock('@proton/app-context/useConfig', () => ({ useConfig: () => ({ DATE_VERSION: '' }) }));
vi.mock('../../../hooks', () => ({ useLumoUserSettings: () => ({ lumoUserSettings: {} }) }));
vi.mock('../../../hooks/useLumoFlags', () => ({ useLumoFlags: () => ({ memory: false }) }));
vi.mock('../../../hooks/useGuestChatHandler', () => ({
    useGuestChatHandler: () => ({ isGuest: true, disclaimerModalProps: { render: false } }),
}));
vi.mock('../../../providers/IsGuestProvider', () => ({ useIsGuest: () => true }));
vi.mock('../../../providers/LumoPlanProvider', () => ({
    useLumoPlan: () => ({ isLumoPlanLoading: true }),
}));
vi.mock('../../../providers/LumoThemeProvider', async () => ({
    ...(await vi.importActual('../../../providers/LumoThemeProvider')),
    useLumoTheme: () => ({ theme: 'light' }),
}));
vi.mock('../../Composer/hooks/useNativeComposerVisibilityApi', () => ({
    useNativeComposerVisibilityApi: () => {},
}));

const renderSettings = () => {
    render(
        <>
            {/* SCSS imports are mocked; retain Modal.scss's dialog display rule. */}
            <style>{'.modal-two-dialog { display: flex; }'}</style>
            <MemoryRouter>
                <ModalPositionsProvider>
                    <SettingsModal open initialPanel="about" />
                </ModalPositionsProvider>
            </MemoryRouter>
        </>
    );

    return screen.getByRole('dialog');
};

it('does not expose the complete settings navigation and panel as the dialog description', () => {
    const dialog = renderSettings();

    expect(dialog).not.toHaveAccessibleDescription();
    expect(dialog).not.toHaveAccessibleDescription(/Account.*Personalization.*Appearance.*About.*Help and support/);
});

it('names the settings dialog independently of its navigation and panel', () => {
    const dialog = renderSettings();

    expect(dialog).toHaveAccessibleName('Settings');
});
