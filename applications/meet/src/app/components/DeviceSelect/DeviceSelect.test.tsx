import type { RefObject } from 'react';
import { useState } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { IcMeetCamera } from '@proton/icons/icons/IcMeetCamera';

import { DeviceSettingsDropdown } from '../DeviceSettingsDropdown';
import { DeviceSelect } from './DeviceSelect';

const mocks = vi.hoisted(() => ({
    isTruncated: true,
}));

vi.mock('../PageHeader/useIsTextTruncated', () => ({
    useIsTextTruncated: () => ({ ref: () => {}, isTruncated: mocks.isTruncated }),
}));

const cameraName = 'MacBook Pro Camera With A Very Long Name (0000:0001)';

const CameraMenu = ({
    anchorRef,
    onClose,
}: {
    anchorRef: RefObject<HTMLButtonElement | null>;
    onClose: () => void;
}) => (
    <DeviceSettingsDropdown anchorRef={anchorRef} onClose={onClose}>
        <p>Cameras</p>
        <button type="button" onClick={onClose}>
            Backgrounds and effects
        </button>
    </DeviceSettingsDropdown>
);

const CameraSelect = ({ hasButtonBefore }: { hasButtonBefore: boolean }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            {hasButtonBefore && <button type="button">Before</button>}
            <DeviceSelect
                title="Video"
                label={cameraName}
                accessibleLabel={`Video: ${cameraName}`}
                icon={IcMeetCamera}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                Content={CameraMenu}
                contentProps={{}}
            />
        </>
    );
};

const renderCameraSelect = ({
    isTruncated,
    hasButtonBefore = true,
}: {
    isTruncated: boolean;
    hasButtonBefore?: boolean;
}) => {
    mocks.isTruncated = isTruncated;
    render(<CameraSelect hasButtonBefore={hasButtonBefore} />);
    return screen.getByRole('button', { name: `Video: ${cameraName}` });
};

const finishClosingTooltips = () => {
    screen
        .queryAllByRole('tooltip')
        .forEach((tooltip) => fireEvent.animationEnd(tooltip, { animationName: 'anime-tooltip-out-last' }));
};

const queryTooltip = () => screen.queryByRole('tooltip', { name: cameraName });

const openMenuWithKeyboard = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: 'Before' }));
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('dialog', { name: 'Device settings' })).toBeInTheDocument();
    finishClosingTooltips();
};

const openMenuAndCloseWithEscape = async (user: ReturnType<typeof userEvent.setup>) => {
    await openMenuWithKeyboard(user);

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Device settings' })).not.toBeInTheDocument();
};

const openMenuAndCloseFromInside = async (user: ReturnType<typeof userEvent.setup>) => {
    await openMenuWithKeyboard(user);

    screen.getByRole('button', { name: 'Backgrounds and effects' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('dialog', { name: 'Device settings' })).not.toBeInTheDocument();
};

describe('DeviceSelect', () => {
    it('is named by its caption and the full device name, with no description', () => {
        const selector = renderCameraSelect({ isTruncated: true });

        expect(selector).toHaveAccessibleName(`Video: ${cameraName}`);
        expect(selector).toHaveAccessibleDescription('');
    });

    it('separates the visible caption from the device name with a space, so the name contains the visible label', () => {
        const selector = renderCameraSelect({ isTruncated: true });

        expect(selector.querySelector('[aria-hidden="true"]')).toHaveTextContent(`Video ${cameraName}`, {
            normalizeWhitespace: false,
        });
    });

    it('shows the full device name in a tooltip when a keyboard user reaches the cut-off selector', async () => {
        const user = userEvent.setup();
        renderCameraSelect({ isTruncated: true });

        await user.click(screen.getByRole('button', { name: 'Before' }));
        await user.tab();

        expect(queryTooltip()).toBeVisible();
        expect(screen.getByRole('button', { name: `Video: ${cameraName}` })).toHaveAccessibleDescription('');
    });

    it('shows the tooltip when the cut-off selector is reached by Tab with nothing focused before', async () => {
        const user = userEvent.setup();
        const selector = renderCameraSelect({ isTruncated: true, hasButtonBefore: false });

        await user.tab();

        expect(selector).toHaveFocus();
        expect(queryTooltip()).toBeVisible();
    });

    it('shows the full device name in a tooltip when the pointer enters the cut-off selector', () => {
        const selector = renderCameraSelect({ isTruncated: true });

        fireEvent.mouseEnter(selector);

        expect(queryTooltip()).toBeVisible();
    });

    it('hides the tooltip on Escape and keeps focus on the selector', async () => {
        const user = userEvent.setup();
        const selector = renderCameraSelect({ isTruncated: true });

        await user.click(screen.getByRole('button', { name: 'Before' }));
        await user.tab();
        expect(queryTooltip()).toBeVisible();

        await user.keyboard('{Escape}');
        finishClosingTooltips();

        expect(queryTooltip()).not.toBeInTheDocument();
        expect(selector).toHaveFocus();
    });

    it('shows no tooltip while the menu is open, on click, hover or focus', async () => {
        const user = userEvent.setup();
        const selector = renderCameraSelect({ isTruncated: true });

        await user.hover(selector);
        expect(queryTooltip()).toBeVisible();

        await user.click(selector);
        finishClosingTooltips();
        expect(screen.getByRole('dialog', { name: 'Device settings' })).toBeInTheDocument();
        expect(queryTooltip()).not.toBeInTheDocument();

        fireEvent.mouseEnter(selector);
        fireEvent.focus(selector, { relatedTarget: screen.getByRole('dialog', { name: 'Device settings' }) });
        expect(queryTooltip()).not.toBeInTheDocument();
    });

    it('gives focus back to the selector with no tooltip when Escape closes the menu', async () => {
        const user = userEvent.setup();
        const selector = renderCameraSelect({ isTruncated: true });

        await openMenuAndCloseWithEscape(user);

        expect(selector).toHaveFocus();
        expect(queryTooltip()).not.toBeInTheDocument();
    });

    it('gives focus back to the selector with no tooltip when a control inside the menu closes it', async () => {
        const user = userEvent.setup();
        const selector = renderCameraSelect({ isTruncated: true });

        await openMenuAndCloseFromInside(user);

        expect(selector).toHaveFocus();
        expect(queryTooltip()).not.toBeInTheDocument();
    });

    it.each([
        ['Escape', openMenuAndCloseWithEscape],
        ['a control inside the menu', openMenuAndCloseFromInside],
    ])('shows the tooltip again on the next Tab focus after %s closed the menu', async (_, closeMenu) => {
        const user = userEvent.setup();
        renderCameraSelect({ isTruncated: true });

        await closeMenu(user);
        await user.tab({ shift: true });
        await user.tab();

        expect(queryTooltip()).toBeVisible();
    });

    it('shows the tooltip again on the next hover after the menu gave focus back', async () => {
        const user = userEvent.setup();
        const selector = renderCameraSelect({ isTruncated: true });

        await openMenuAndCloseFromInside(user);
        expect(queryTooltip()).not.toBeInTheDocument();

        fireEvent.mouseEnter(selector);

        expect(queryTooltip()).toBeVisible();
    });

    it('shows the tooltip on Tab from nothing focused after a click outside closed the menu', async () => {
        const user = userEvent.setup();
        const selector = renderCameraSelect({ isTruncated: true, hasButtonBefore: false });

        await user.click(selector);
        finishClosingTooltips();
        expect(screen.getByRole('dialog', { name: 'Device settings' })).toBeInTheDocument();

        await user.click(document.body);
        expect(screen.queryByRole('dialog', { name: 'Device settings' })).not.toBeInTheDocument();
        expect(document.body).toHaveFocus();

        await user.tab();

        expect(selector).toHaveFocus();
        expect(queryTooltip()).toBeVisible();
    });

    it('shows no tooltip on hover or focus when the device name fits', async () => {
        const user = userEvent.setup();
        const selector = renderCameraSelect({ isTruncated: false });

        await user.hover(selector);
        await user.click(screen.getByRole('button', { name: 'Before' }));
        await user.tab();

        expect(selector).toHaveFocus();
        expect(queryTooltip()).not.toBeInTheDocument();
    });
});
