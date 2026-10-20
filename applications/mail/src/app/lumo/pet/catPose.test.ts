import { CatJump, CatPose, CatRun, selectCatPose } from './catPose';

const idle = {
    jump: null,
    isHidden: false,
    run: null,
    isHovered: false,
};

describe('selectCatPose', () => {
    it('sits when nothing is happening', () => {
        expect(selectCatPose(idle)).toBe(CatPose.SIT);
    });

    it('perks up when hovered', () => {
        expect(selectCatPose({ ...idle, isHovered: true })).toBe(CatPose.PERK);
    });

    it('plays each run phase over hovering', () => {
        const busyCat = { ...idle, isHovered: true };

        expect(selectCatPose({ ...busyCat, run: CatRun.GALLOP })).toBe(CatPose.RUN);
        expect(selectCatPose({ ...busyCat, run: CatRun.SKID })).toBe(CatPose.SKID);
    });

    it('sits while hidden, so no thought cloud floats above the ears', () => {
        expect(
            selectCatPose({
                ...idle,
                isHidden: true,
                isHovered: true,
            })
        ).toBe(CatPose.SIT);
    });

    it('plays the jump in its direction over everything, hidden included', () => {
        const busyHiddenCat = { ...idle, isHidden: true, run: CatRun.GALLOP, isHovered: true };

        expect(selectCatPose({ ...busyHiddenCat, jump: CatJump.OUT })).toBe(CatPose.JUMP_OUT);
        expect(selectCatPose({ ...busyHiddenCat, jump: CatJump.IN })).toBe(CatPose.JUMP_IN);
    });
});
