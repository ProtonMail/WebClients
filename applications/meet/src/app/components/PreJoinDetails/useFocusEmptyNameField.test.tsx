import { useRef } from 'react';

import { act, fireEvent, render, screen } from '@testing-library/react';

import {
    selectCameraPermission,
    selectMicrophonePermission,
    selectPermissionsModals,
} from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { PermissionsModalType } from '@proton/meet/store/slices/deviceManagementSlice/types';

import { useFocusEmptyNameField } from './useFocusEmptyNameField';

const mocks = vi.hoisted(() => ({
    permissionsModal: 'none',
    cameraPermission: 'prompt',
    microphonePermission: 'prompt',
}));

vi.mock('@proton/meet/store/hooks', () => ({
    useMeetSelector: (selector: unknown) => {
        const values = new Map<unknown, unknown>([
            [selectPermissionsModals, { permissionsModal: mocks.permissionsModal }],
            [selectCameraPermission, mocks.cameraPermission],
            [selectMicrophonePermission, mocks.microphonePermission],
        ]);
        return values.get(selector);
    },
}));

const NameFieldPage = ({ isFocusOnNameExpected }: { isFocusOnNameExpected: boolean }) => {
    const nameInputRef = useRef<HTMLInputElement>(null);
    useFocusEmptyNameField(nameInputRef, isFocusOnNameExpected);

    return (
        <main tabIndex={-1}>
            <p>Empty area</p>
            <input aria-label="Name" ref={nameInputRef} defaultValue="  " />
            <button type="button">Camera</button>
            <a href="#main-content">Skip to content</a>
        </main>
    );
};

const renderPage = (isFocusOnNameExpected = true) => {
    const view = render(<NameFieldPage isFocusOnNameExpected={isFocusOnNameExpected} />);
    act(() => {
        vi.runAllTimers();
    });
    return view;
};

const getNameField = () => screen.getByRole('textbox', { name: 'Name' });

const leaveFocusOnBody = () => {
    act(() => {
        (document.activeElement as HTMLElement | null)?.blur();
    });
};

const runDeferredChecks = () => {
    act(() => {
        vi.runAllTimers();
    });
};

describe('useFocusEmptyNameField', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        mocks.permissionsModal = PermissionsModalType.NONE;
        mocks.cameraPermission = 'prompt';
        mocks.microphonePermission = 'prompt';
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('focuses the name field when the guest comes back to the window', () => {
        renderPage();
        leaveFocusOnBody();

        fireEvent.focus(window);
        runDeferredChecks();

        expect(getNameField()).toHaveFocus();
    });

    it('focuses the name field when the tab becomes visible again', () => {
        renderPage();
        leaveFocusOnBody();

        fireEvent(document, new Event('visibilitychange'));
        runDeferredChecks();

        expect(getNameField()).toHaveFocus();
    });

    it('keeps focus on another control the guest chose', () => {
        renderPage();
        const cameraButton = screen.getByRole('button', { name: 'Camera' });
        act(() => cameraButton.focus());

        fireEvent.focus(window);
        runDeferredChecks();

        expect(cameraButton).toHaveFocus();
    });

    it('focuses the name field after a click on an empty area of the page', () => {
        renderPage();
        act(() => screen.getByRole('main').focus());

        fireEvent.click(screen.getByText('Empty area'));

        expect(getNameField()).toHaveFocus();
    });

    it('keeps focus on the page content after the skip link is used', () => {
        renderPage();
        const main = screen.getByRole('main');
        act(() => main.focus());

        fireEvent.click(screen.getByRole('link', { name: 'Skip to content' }));

        expect(main).toHaveFocus();
    });

    it('does not move focus after a click on a button the browser does not focus', () => {
        renderPage();
        leaveFocusOnBody();

        fireEvent.click(screen.getByRole('button', { name: 'Camera' }));

        expect(document.body).toHaveFocus();
    });

    it('keeps the caret where it was when focus comes back', () => {
        renderPage();
        const nameField = getNameField() as HTMLInputElement;
        nameField.setSelectionRange(1, 1);
        act(() => screen.getByRole('main').focus());
        const restoreSelection = vi.spyOn(nameField, 'setSelectionRange');

        fireEvent.click(screen.getByText('Empty area'));

        expect(nameField).toHaveFocus();
        expect(restoreSelection).toHaveBeenCalledWith(1, 1, expect.anything());
    });

    it('waits for the permissions modal to close before focusing the name field', () => {
        mocks.permissionsModal = PermissionsModalType.PERMISSIONS_MODAL;
        const { rerender } = renderPage();
        leaveFocusOnBody();

        fireEvent.focus(window);
        runDeferredChecks();
        expect(document.body).toHaveFocus();

        mocks.permissionsModal = PermissionsModalType.NONE;
        rerender(<NameFieldPage isFocusOnNameExpected />);
        runDeferredChecks();

        expect(getNameField()).toHaveFocus();
    });

    it('focuses the name field after each browser permission prompt is answered', () => {
        const { rerender } = renderPage();
        leaveFocusOnBody();

        mocks.cameraPermission = 'denied';
        rerender(<NameFieldPage isFocusOnNameExpected />);
        runDeferredChecks();
        expect(getNameField()).toHaveFocus();

        leaveFocusOnBody();
        mocks.microphonePermission = 'granted';
        rerender(<NameFieldPage isFocusOnNameExpected />);
        runDeferredChecks();
        expect(getNameField()).toHaveFocus();
    });

    it('leaves focus alone when the name field is not expected to take it', () => {
        renderPage(false);
        leaveFocusOnBody();

        fireEvent.focus(window);
        runDeferredChecks();
        act(() => screen.getByRole('main').focus());
        fireEvent.click(screen.getByText('Empty area'));

        expect(screen.getByRole('main')).toHaveFocus();
    });
});
