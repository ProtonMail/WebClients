export enum PanelSide {
    RIGHT = 'right',
    LEFT = 'left',
}

export interface PanelSideState {
    userSide: PanelSide;
    isComposerOverride: boolean;
}

export const INITIAL_PANEL_SIDE_STATE: PanelSideState = { userSide: PanelSide.RIGHT, isComposerOverride: false };

export const getOppositeSide = (side: PanelSide) => {
    return side === PanelSide.RIGHT ? PanelSide.LEFT : PanelSide.RIGHT;
};

export const getShownSide = ({ userSide, isComposerOverride }: PanelSideState) => {
    return isComposerOverride ? PanelSide.LEFT : userSide;
};

export const composersOpened = (state: PanelSideState): PanelSideState => {
    return { ...state, isComposerOverride: true };
};

export const composersClosed = (state: PanelSideState): PanelSideState => {
    return { ...state, isComposerOverride: false };
};

/** Sides are logical, so in RTL the physical left half of the mailbox is the right side. */
export const getDropSide = (pointerX: number, bounds: Pick<DOMRect, 'left' | 'width'>, isRTL: boolean) => {
    const isPhysicalLeft = pointerX < bounds.left + bounds.width / 2;
    if (isRTL) {
        return isPhysicalLeft ? PanelSide.RIGHT : PanelSide.LEFT;
    }
    return isPhysicalLeft ? PanelSide.LEFT : PanelSide.RIGHT;
};

/** A switch made while a composer holds the panel left is the user's choice from then on. */
export const switchSides = (state: PanelSideState): PanelSideState => {
    return {
        userSide: getOppositeSide(getShownSide(state)),
        isComposerOverride: false,
    };
};
