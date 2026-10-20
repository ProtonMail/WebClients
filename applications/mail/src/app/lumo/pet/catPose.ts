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

interface CatState {
    isHovered: boolean;
}

export const selectCatPose = ({ isHovered }: CatState): CatPose => {
    if (isHovered) {
        return CatPose.PERK;
    }
    return CatPose.SIT;
};
