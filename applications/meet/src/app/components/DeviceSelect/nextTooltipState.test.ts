import { type TooltipEvent, type TooltipState, nextTooltipState } from './nextTooltipState';

const transitions: Record<TooltipEvent, { menuClosed: TooltipState; menuOpen: TooltipState }> = {
    mouseEnter: { menuClosed: 'requested', menuOpen: 'idle' },
    focus: { menuClosed: 'requested', menuOpen: 'idle' },
    menuGaveFocusBack: { menuClosed: 'idle', menuOpen: 'idle' },
    mouseLeave: { menuClosed: 'idle', menuOpen: 'idle' },
    blur: { menuClosed: 'idle', menuOpen: 'idle' },
    click: { menuClosed: 'idle', menuOpen: 'idle' },
    escape: { menuClosed: 'idle', menuOpen: 'idle' },
};

const cases = Object.entries(transitions).flatMap(([event, { menuClosed, menuOpen }]) => [
    { event: event as TooltipEvent, isMenuOpen: false, expected: menuClosed },
    { event: event as TooltipEvent, isMenuOpen: true, expected: menuOpen },
]);

describe('nextTooltipState', () => {
    it.each(cases)('$event with the menu open: $isMenuOpen goes to $expected', ({ event, isMenuOpen, expected }) => {
        expect(nextTooltipState(event, isMenuOpen)).toBe(expected);
    });
});
