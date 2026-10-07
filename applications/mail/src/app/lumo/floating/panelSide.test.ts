import {
    INITIAL_PANEL_SIDE_STATE,
    PanelSide,
    composersClosed,
    composersOpened,
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
});
