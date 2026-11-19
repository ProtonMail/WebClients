export type TooltipState = 'idle' | 'requested';

export type TooltipEvent = 'mouseEnter' | 'focus' | 'menuGaveFocusBack' | 'mouseLeave' | 'blur' | 'click' | 'escape';

export const nextTooltipState = (event: TooltipEvent, isMenuOpen: boolean): TooltipState => {
    switch (event) {
        case 'mouseEnter':
        case 'focus':
            return isMenuOpen ? 'idle' : 'requested';
        case 'menuGaveFocusBack':
        case 'mouseLeave':
        case 'blur':
        case 'click':
        case 'escape':
            return 'idle';
    }
};
