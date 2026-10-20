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

export enum CatRun {
    GALLOP = 'gallop',
    SKID = 'skid',
}

const RUN_POSES: Record<CatRun, CatPose> = {
    [CatRun.GALLOP]: CatPose.RUN,
    [CatRun.SKID]: CatPose.SKID,
};

interface CatState {
    jump: CatJump | null;
    isHidden: boolean;
    run: CatRun | null;
    isHovered: boolean;
}

export const selectCatPose = ({ jump, isHidden, run, isHovered }: CatState): CatPose => {
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
    if (isHovered) {
        return CatPose.PERK;
    }
    return CatPose.SIT;
};
