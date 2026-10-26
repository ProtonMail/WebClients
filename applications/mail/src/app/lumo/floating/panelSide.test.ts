import {
    INITIAL_PANEL_SIDE_STATE,
    PanelSide,
    composersClosed,
    composersOpened,
    getDropSide,
    getShownSide,
    switchSides,
} from './panelSide';

const leftByUser = switchSides(INITIAL_PANEL_SIDE_STATE);

describe('panelSide', () => {
    it('moves left while a composer is open and returns to the user side once they close', () => {
        const composing = composersOpened(INITIAL_PANEL_SIDE_STATE);
        expect(getShownSide(composing)).toBe(PanelSide.LEFT);

        expect(getShownSide(composersClosed(composing))).toBe(PanelSide.RIGHT);
    });

    it('flips the user side when no composer holds the panel', () => {
        expect(getShownSide(leftByUser)).toBe(PanelSide.LEFT);
        expect(getShownSide(switchSides(leftByUser))).toBe(PanelSide.RIGHT);
    });

    it('keeps a switch made during composing after the composers close', () => {
        const switchedWhileComposing = switchSides(composersOpened(INITIAL_PANEL_SIDE_STATE));
        expect(getShownSide(switchedWhileComposing)).toBe(PanelSide.RIGHT);

        expect(getShownSide(composersClosed(switchedWhileComposing))).toBe(PanelSide.RIGHT);
    });

    it('stays left through composing when the user already chose left', () => {
        const composing = composersOpened(leftByUser);
        expect(getShownSide(composing)).toBe(PanelSide.LEFT);

        expect(getShownSide(composersClosed(composing))).toBe(PanelSide.LEFT);
    });

    describe('getDropSide', () => {
        const mailbox = { left: 200, width: 1000 };

        it.each([
            ['the left half in LTR', 300, false, PanelSide.LEFT],
            ['the right half in LTR', 1100, false, PanelSide.RIGHT],
            ['the midline in LTR', 700, false, PanelSide.RIGHT],
            ['just left of the midline in LTR', 699, false, PanelSide.LEFT],
            ['the left half in RTL', 300, true, PanelSide.RIGHT],
            ['the right half in RTL', 1100, true, PanelSide.LEFT],
            ['the midline in RTL', 700, true, PanelSide.LEFT],
            ['a pointer left of the mailbox', 50, false, PanelSide.LEFT],
            ['a pointer right of the mailbox', 1500, false, PanelSide.RIGHT],
        ])('reads %s', (_, pointerX, isRTL, side) => {
            expect(getDropSide(pointerX, mailbox, isRTL)).toBe(side);
        });
    });
});
