import { PanelSide } from '../floating/panelSide';
import { CatActivity, CatJump, CatPose, CatRun, CatTrick, selectCatPose } from './catPose';

const idle = {
    jump: null,
    isHidden: false,
    run: null,
    trick: null,
    isSweeping: false,
    isHovered: false,
    isChatOpen: true,
    activity: null,
    isThinking: false,
    isCelebrating: false,
    isTyping: false,
    side: PanelSide.RIGHT,
};

describe('selectCatPose', () => {
    it('sits when nothing is happening', () => {
        expect(selectCatPose(idle)).toBe(CatPose.SIT);
    });

    it('watches the prompt on its left while typing on the right side', () => {
        expect(selectCatPose({ ...idle, isTyping: true })).toBe(CatPose.WATCH_LEFT);
    });

    it('watches the prompt on its right while typing on the left side', () => {
        expect(selectCatPose({ ...idle, isTyping: true, side: PanelSide.LEFT })).toBe(CatPose.WATCH_RIGHT);
    });

    it('thinks while Lumo is generating, even while typing', () => {
        expect(selectCatPose({ ...idle, isThinking: true, isTyping: true })).toBe(CatPose.THINK);
    });

    it('celebrating beats thinking', () => {
        expect(selectCatPose({ ...idle, isThinking: true, isCelebrating: true })).toBe(CatPose.HAPPY);
    });

    it.each([
        [CatActivity.BROWSE_FOLDERS, CatPose.BROWSE_FOLDERS],
        [CatActivity.SEARCH, CatPose.SEARCH],
        [CatActivity.WRITE, CatPose.WRITE],
    ])('acts out %s over thinking', (activity, pose) => {
        expect(selectCatPose({ ...idle, activity, isThinking: true })).toBe(pose);
    });

    it('sits while the chat is closed, whatever Lumo is doing', () => {
        const busyCat = { ...idle, activity: CatActivity.WRITE, isThinking: true, isTyping: true };

        expect(selectCatPose({ ...busyCat, isChatOpen: false })).toBe(CatPose.SIT);
    });

    it('still sweeps, plays tricks and celebrates while the chat is closed', () => {
        const closedChat = { ...idle, isChatOpen: false };

        expect(selectCatPose({ ...closedChat, isSweeping: true })).toBe(CatPose.SWEEP);
        expect(selectCatPose({ ...closedChat, trick: CatTrick.ENCRYPT })).toBe(CatPose.ENCRYPT);
        expect(selectCatPose({ ...closedChat, isCelebrating: true })).toBe(CatPose.HAPPY);
    });

    it('celebrating beats an activity', () => {
        expect(selectCatPose({ ...idle, activity: CatActivity.WRITE, isCelebrating: true })).toBe(CatPose.HAPPY);
    });

    it('perks up when hovered, over celebrating, an activity and thinking', () => {
        expect(
            selectCatPose({
                ...idle,
                isHovered: true,
                activity: CatActivity.BROWSE_FOLDERS,
                isThinking: true,
                isCelebrating: true,
            })
        ).toBe(CatPose.PERK);
    });

    it('sweeps the envelopes over hovering and everything below it', () => {
        expect(
            selectCatPose({
                ...idle,
                isSweeping: true,
                isHovered: true,
                activity: CatActivity.SEARCH,
                isThinking: true,
            })
        ).toBe(CatPose.SWEEP);
    });

    it('plays each trick over sweeping and everything below it', () => {
        const busyCat = { ...idle, isSweeping: true, isHovered: true, isThinking: true, isTyping: true };

        expect(selectCatPose({ ...busyCat, trick: CatTrick.SCHRODINGER_IN_BOX })).toBe(CatPose.SCHRODINGER_IN_BOX);
        expect(selectCatPose({ ...busyCat, trick: CatTrick.SCHRODINGER_OUT_OF_BOX })).toBe(
            CatPose.SCHRODINGER_OUT_OF_BOX
        );
        expect(selectCatPose({ ...busyCat, trick: CatTrick.NINE_LIVES })).toBe(CatPose.NINE_LIVES);
        expect(selectCatPose({ ...busyCat, trick: CatTrick.ENCRYPT })).toBe(CatPose.ENCRYPT);
    });

    it('runs, hides and jumps over a trick', () => {
        const trickingCat = { ...idle, trick: CatTrick.NINE_LIVES };

        expect(selectCatPose({ ...trickingCat, run: CatRun.GALLOP })).toBe(CatPose.RUN);
        expect(selectCatPose({ ...trickingCat, isHidden: true })).toBe(CatPose.SIT);
        expect(selectCatPose({ ...trickingCat, jump: CatJump.OUT })).toBe(CatPose.JUMP_OUT);
    });

    it('plays each run phase over sweeping, hovering, celebrating and thinking', () => {
        const busyCat = { ...idle, isSweeping: true, isHovered: true, isThinking: true, isCelebrating: true };

        expect(selectCatPose({ ...busyCat, run: CatRun.GALLOP })).toBe(CatPose.RUN);
        expect(selectCatPose({ ...busyCat, run: CatRun.SKID })).toBe(CatPose.SKID);
    });

    it('sits while hidden, so no thought cloud floats above the ears', () => {
        expect(
            selectCatPose({
                ...idle,
                isHidden: true,
                isSweeping: true,
                isHovered: true,
                activity: CatActivity.SEARCH,
                isThinking: true,
            })
        ).toBe(CatPose.SIT);
    });

    it('plays the jump in its direction over everything, hidden included', () => {
        const busyHiddenCat = { ...idle, isHidden: true, run: CatRun.GALLOP, isHovered: true, isThinking: true };

        expect(selectCatPose({ ...busyHiddenCat, jump: CatJump.OUT })).toBe(CatPose.JUMP_OUT);
        expect(selectCatPose({ ...busyHiddenCat, jump: CatJump.IN })).toBe(CatPose.JUMP_IN);
    });
});
