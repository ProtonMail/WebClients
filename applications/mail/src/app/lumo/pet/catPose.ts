import { PanelSide } from '../floating/panelSide';

export enum CatPose {
    SIT = 'sit',
    THINK = 'think',
    WATCH_LEFT = 'watch-left',
    WATCH_RIGHT = 'watch-right',
    HAPPY = 'happy',
    RUN = 'run',
    SKID = 'skid',
    PERK = 'perk',
    JUMP_OUT = 'jump-out',
    JUMP_IN = 'jump-in',
    BROWSE_FOLDERS = 'browse-folders',
    SEARCH = 'search',
    WRITE = 'write',
    SWEEP = 'sweep',
    SCHRODINGER_IN_BOX = 'schrodinger-in-box',
    SCHRODINGER_OUT_OF_BOX = 'schrodinger-out-of-box',
    NINE_LIVES = 'nine-lives',
    ENCRYPT = 'encrypt',
}

export enum CatJump {
    OUT = 'out',
    IN = 'in',
}

const JUMP_POSES: Record<CatJump, CatPose> = {
    [CatJump.OUT]: CatPose.JUMP_OUT,
    [CatJump.IN]: CatPose.JUMP_IN,
};

export enum CatActivity {
    BROWSE_FOLDERS = 'browse-folders',
    SEARCH = 'search',
    WRITE = 'write',
}

const ACTIVITY_POSES: Record<CatActivity, CatPose> = {
    [CatActivity.BROWSE_FOLDERS]: CatPose.BROWSE_FOLDERS,
    [CatActivity.SEARCH]: CatPose.SEARCH,
    [CatActivity.WRITE]: CatPose.WRITE,
};

export enum CatRun {
    GALLOP = 'gallop',
    SKID = 'skid',
}

const RUN_POSES: Record<CatRun, CatPose> = {
    [CatRun.GALLOP]: CatPose.RUN,
    [CatRun.SKID]: CatPose.SKID,
};

export enum CatTrick {
    SCHRODINGER_IN_BOX = 'schrodinger-in-box',
    SCHRODINGER_OUT_OF_BOX = 'schrodinger-out-of-box',
    NINE_LIVES = 'nine-lives',
    ENCRYPT = 'encrypt',
}

const TRICK_POSES: Record<CatTrick, CatPose> = {
    [CatTrick.SCHRODINGER_IN_BOX]: CatPose.SCHRODINGER_IN_BOX,
    [CatTrick.SCHRODINGER_OUT_OF_BOX]: CatPose.SCHRODINGER_OUT_OF_BOX,
    [CatTrick.NINE_LIVES]: CatPose.NINE_LIVES,
    [CatTrick.ENCRYPT]: CatPose.ENCRYPT,
};

interface CatState {
    jump: CatJump | null;
    isHidden: boolean;
    run: CatRun | null;
    trick: CatTrick | null;
    isSweeping: boolean;
    isHovered: boolean;
    isChatOpen: boolean;
    activity: CatActivity | null;
    isThinking: boolean;
    isCelebrating: boolean;
    isTyping: boolean;
    side: PanelSide;
}

export const selectCatPose = ({
    jump,
    isHidden,
    run,
    trick,
    isSweeping,
    isHovered,
    isChatOpen,
    activity,
    isThinking,
    isCelebrating,
    isTyping,
    side,
}: CatState): CatPose => {
    if (jump) {
        return JUMP_POSES[jump];
    }
    // Only the ears show, and the thought cloud would float above them
    if (isHidden) {
        return CatPose.SIT;
    }
    if (run) {
        return RUN_POSES[run];
    }
    if (trick) {
        return TRICK_POSES[trick];
    }
    if (isSweeping) {
        return CatPose.SWEEP;
    }
    if (isHovered) {
        return CatPose.PERK;
    }
    if (isCelebrating) {
        return CatPose.HAPPY;
    }
    // Lumo keeps working with the chat closed, but the cat only acts it out beside the chat
    if (!isChatOpen) {
        return CatPose.SIT;
    }
    if (activity) {
        return ACTIVITY_POSES[activity];
    }
    if (isThinking) {
        return CatPose.THINK;
    }
    if (isTyping) {
        return side === PanelSide.RIGHT ? CatPose.WATCH_LEFT : CatPose.WATCH_RIGHT;
    }
    return CatPose.SIT;
};
