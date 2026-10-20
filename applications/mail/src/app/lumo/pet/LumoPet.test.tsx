import { fireEvent, render, screen } from '@testing-library/react';

import { useLumoAgentDrawer } from '@proton/llm/lib/lumoAgent/ui/lumoAgentDrawerContext';

import { PanelSide } from '../floating/panelSide';
import CatSprite from './CatSprite';
import LumoPet from './LumoPet';
import { CatJump, CatPose, CatRun } from './catPose';

jest.mock('@proton/llm/lib/lumoAgent/ui/lumoAgentDrawerContext', () => ({ useLumoAgentDrawer: jest.fn() }));
jest.mock('./CatSprite', () => ({ __esModule: true, default: jest.fn(() => null) }));

const onToggle = jest.fn();
const onMove = jest.fn();
const onDock = jest.fn();
const onNewChat = jest.fn();
const onHide = jest.fn();
const onReveal = jest.fn();
const onJumpEnd = jest.fn();
const openDebugReport = jest.fn();

interface Setup {
    isPanelOpen?: boolean;
    side?: PanelSide;
    run?: CatRun | null;
    jump?: CatJump | null;
    isHidden?: boolean;
}

const pet = ({ isPanelOpen = false, side = PanelSide.RIGHT, run = null, jump = null, isHidden = false }: Setup) => {
    jest.mocked(useLumoAgentDrawer).mockReturnValue({
        hasConversation: true,
        openDebugReport,
    } as unknown as ReturnType<typeof useLumoAgentDrawer>);
    return (
        <>
            <LumoPet
                side={side}
                isPanelOpen={isPanelOpen}
                motion={{ run, jump, isHidden }}
                actions={{ onToggle, onMove, onDock, onNewChat, onHide, onReveal }}
                onJumpEnd={onJumpEnd}
            />
            <button type="button">Elsewhere</button>
        </>
    );
};

const renderPet = (setup: Setup = {}) => {
    const rendered = render(pet(setup));
    return { ...rendered, rerenderPet: (nextSetup: Setup) => rendered.rerender(pet({ ...setup, ...nextSetup })) };
};

const catButton = () => screen.getByRole('button', { name: 'Toggle Lumo' });
const dock = (container: HTMLElement) => container.querySelector('.lumo-pet-dock');
const catSlot = (container: HTMLElement) => container.querySelector('.lumo-pet-cat-slot')!;
const menu = (container: HTMLElement) => container.querySelector('.lumo-pet-menu');
const shownSprite = () => jest.mocked(CatSprite).mock.lastCall![0];
const shownPose = () => shownSprite().pose;

// Spied after lookup, because role queries call matches too
const focusCat = (isFocusVisible: boolean) => {
    const button = catButton();
    jest.spyOn(button, 'matches').mockReturnValue(isFocusVisible);
    fireEvent.focusIn(button);
    return button;
};

beforeEach(() => jest.clearAllMocks());

describe('LumoPet', () => {
    it('toggles the card on a click, never the menu', () => {
        const { container } = renderPet();

        fireEvent.click(catButton());

        expect(onToggle).toHaveBeenCalledTimes(1);
        expect(dock(container)).not.toHaveClass('lumo-pet-dock--menu-open');
    });

    it.each([true, false])('reports the card as expanded: %s', (isPanelOpen) => {
        renderPet({ isPanelOpen });

        expect(catButton()).toHaveAttribute('aria-expanded', String(isPanelOpen));
    });

    it('perks up and shows the menu while the pointer is over it', () => {
        const { container } = renderPet();
        expect(shownPose()).toBe(CatPose.SIT);

        fireEvent.pointerEnter(dock(container)!);
        expect(shownPose()).toBe(CatPose.PERK);
        expect(dock(container)).toHaveClass('lumo-pet-dock--menu-open');

        fireEvent.pointerLeave(dock(container)!);
        expect(shownPose()).toBe(CatPose.SIT);
        expect(dock(container)).not.toHaveClass('lumo-pet-dock--menu-open');
    });

    it.each([
        ['opens the menu on keyboard focus', true],
        ['leaves the menu shut on a mouse-press focus', false],
    ])('%s', (_, isFocusVisible) => {
        const { container } = renderPet();

        const button = focusCat(isFocusVisible);

        expect(button.matches).toHaveBeenCalledWith(':focus-visible');
        expect(dock(container)!.classList.contains('lumo-pet-dock--menu-open')).toBe(isFocusVisible);
    });

    it('closes only the menu on Escape, keeping the key from the page behind it', () => {
        const pageKeyDown = jest.fn();
        document.addEventListener('keydown', pageKeyDown);
        const { container } = renderPet();
        const button = focusCat(true);

        fireEvent.keyDown(button, { key: 'Escape' });

        expect(dock(container)).not.toHaveClass('lumo-pet-dock--menu-open');
        expect(pageKeyDown).not.toHaveBeenCalled();
        document.removeEventListener('keydown', pageKeyDown);
    });

    it('lets Escape through to the page while the menu is shut', () => {
        const pageKeyDown = jest.fn();
        document.addEventListener('keydown', pageKeyDown);
        renderPet();

        fireEvent.keyDown(catButton(), { key: 'Escape' });

        expect(pageKeyDown).toHaveBeenCalledTimes(1);
        document.removeEventListener('keydown', pageKeyDown);
    });

    it('keeps the menu open while focus moves into it, and closes it when focus leaves', () => {
        const { container } = renderPet();
        const button = focusCat(true);

        fireEvent.focusOut(button, { relatedTarget: screen.getByRole('button', { name: 'New chat' }) });
        expect(dock(container)).toHaveClass('lumo-pet-dock--menu-open');

        fireEvent.focusOut(button, { relatedTarget: screen.getByRole('button', { name: 'Elsewhere' }) });
        expect(dock(container)).not.toHaveClass('lumo-pet-dock--menu-open');
    });

    it('keeps the menu under a resting pointer when the opening card takes focus', () => {
        const { container } = renderPet();
        fireEvent.pointerEnter(dock(container)!);
        const button = focusCat(false);

        fireEvent.focusOut(button, { relatedTarget: screen.getByRole('button', { name: 'Elsewhere' }) });

        expect(dock(container)).toHaveClass('lumo-pet-dock--menu-open');
    });

    it('drops the hover and shuts the menu when the cat moves away from the pointer', () => {
        const { container } = renderPet();
        fireEvent.pointerEnter(dock(container)!);

        fireEvent.click(screen.getByRole('button', { name: 'Move Lumo to the left' }));

        expect(onMove).toHaveBeenCalledTimes(1);
        expect(shownPose()).toBe(CatPose.SIT);
        expect(dock(container)).not.toHaveClass('lumo-pet-dock--menu-open');
    });

    it('starts a new chat through its own handler', () => {
        renderPet();

        fireEvent.click(screen.getByRole('button', { name: 'New chat' }));

        expect(onNewChat).toHaveBeenCalledTimes(1);
    });

    // Report opens a composer, which sends the cat to the left side
    it.each([
        ['New chat', onNewChat],
        ['Report a problem', openDebugReport],
    ])('drops the hover and shuts the menu on %s, in case the cat runs from the pointer', (label, handler) => {
        const { container } = renderPet();
        fireEvent.pointerEnter(dock(container)!);

        fireEvent.click(screen.getByRole('button', { name: label }));

        expect(handler).toHaveBeenCalledTimes(1);
        expect(shownPose()).toBe(CatPose.SIT);
        expect(dock(container)).not.toHaveClass('lumo-pet-dock--menu-open');
    });

    it('drops the hover and shuts the menu when the cat hides from the pointer', () => {
        const { container } = renderPet();
        fireEvent.pointerEnter(dock(container)!);

        fireEvent.click(screen.getByRole('button', { name: 'Hide Lumo' }));

        expect(onHide).toHaveBeenCalledTimes(1);
        expect(shownPose()).toBe(CatPose.SIT);
        expect(dock(container)).not.toHaveClass('lumo-pet-dock--menu-open');
    });

    it('shows only the ears while hidden, and reveals itself on a click without the menu', () => {
        const { container } = renderPet({ isHidden: true });

        fireEvent.click(screen.getByRole('button', { name: 'Show Lumo' }));

        expect(onReveal).toHaveBeenCalledTimes(1);
        expect(onToggle).not.toHaveBeenCalled();
        expect(catSlot(container)).toHaveClass('lumo-pet-cat-slot--hidden');
        expect(menu(container)).not.toBeInTheDocument();
    });

    it.each<[string, Setup]>([
        ['hidden', { isHidden: true }],
        ['running', { run: CatRun.GALLOP }],
        ['jumping', { jump: CatJump.IN }],
    ])('leaves the menu out while %s, keeping the empty box click-through under the pointer', (_, setup) => {
        const { container } = renderPet(setup);

        fireEvent.pointerEnter(dock(container)!);

        expect(menu(container)).not.toBeInTheDocument();
        expect(dock(container)).not.toHaveClass('lumo-pet-dock--menu-open');
    });

    it.each([
        [PanelSide.LEFT, CatRun.GALLOP, true],
        [PanelSide.LEFT, null, false],
        [PanelSide.RIGHT, CatRun.GALLOP, false],
    ])('on the %s with run %s, mirrors the cat: %s', (side, run, isMirrored) => {
        renderPet({ side, run });

        expect(shownSprite().isMirrored).toBe(isMirrored);
    });

    it('plays the jump on its slot and reports only the slot animation ending', () => {
        const { container } = renderPet({ jump: CatJump.OUT });
        expect(shownPose()).toBe(CatPose.JUMP_OUT);
        expect(catSlot(container)).toHaveClass('lumo-pet-cat-slot--jump-out');

        fireEvent.animationEnd(catButton());
        expect(onJumpEnd).not.toHaveBeenCalled();

        fireEvent.animationEnd(catSlot(container));
        expect(onJumpEnd).toHaveBeenCalledTimes(1);
    });
});
