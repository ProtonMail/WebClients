import { CatPose, selectCatPose } from './catPose';

const idle = {
    isHovered: false,
};

describe('selectCatPose', () => {
    it('sits when nothing is happening', () => {
        expect(selectCatPose(idle)).toBe(CatPose.SIT);
    });

    it('perks up when hovered', () => {
        expect(selectCatPose({ ...idle, isHovered: true })).toBe(CatPose.PERK);
    });
});
