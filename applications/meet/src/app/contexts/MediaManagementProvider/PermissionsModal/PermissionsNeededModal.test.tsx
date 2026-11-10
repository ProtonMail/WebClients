import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { deviceManagementReducer, showPermissionsModal } from '@proton/meet/store/slices/deviceManagementSlice';
import { PermissionsModalType } from '@proton/meet/store/slices/deviceManagementSlice/types';
import { ProtonStoreContext } from '@proton/react-redux-store/ProtonStoreContext';

import { PermissionsNeededModal } from './PermissionsNeededModal';

// ModalTwo renders <dialog> without `open` and shows it through the app's CSS, which happy-dom does not load,
// so happy-dom's default `display: none` for a <dialog> without `open` would hide it from role queries.
beforeAll(() => {
    const style = document.createElement('style');
    style.textContent = 'dialog { display: block; }';
    document.head.appendChild(style);
});

const renderWithCameraAndMicrophoneNotGranted = () => {
    const store = configureStore({ reducer: { ...deviceManagementReducer } });
    store.dispatch(showPermissionsModal({ modal: PermissionsModalType.PERMISSIONS_MODAL }));

    render(
        <Provider context={ProtonStoreContext} store={store}>
            <PermissionsNeededModal />
        </Provider>
    );

    return {
        getPermissionsModal: () => store.getState().deviceManagement.uiModals.permissionsModal,
    };
};

describe('PermissionsNeededModal', () => {
    it('offers only the two choices, without a close button', () => {
        renderWithCameraAndMicrophoneNotGranted();

        const dialog = screen.getByRole('dialog', { name: 'Allow camera and microphone' });
        expect(
            within(dialog)
                .getAllByRole('button')
                .map((button) => button.textContent)
        ).toEqual(['Allow access', 'Continue without mic and camera']);
    });

    it('dismisses the modal on Escape like "Continue without mic and camera"', async () => {
        const { getPermissionsModal } = renderWithCameraAndMicrophoneNotGranted();

        await userEvent.keyboard('{Escape}');

        expect(getPermissionsModal()).toBe(PermissionsModalType.NONE);
    });

    it('dismisses the modal on "Continue without mic and camera"', async () => {
        const { getPermissionsModal } = renderWithCameraAndMicrophoneNotGranted();

        await userEvent.click(screen.getByRole('button', { name: 'Continue without mic and camera' }));

        expect(getPermissionsModal()).toBe(PermissionsModalType.NONE);
    });
});
