import { orderPlacements } from './utils';

describe('popper utils', () => {
    describe('orderPlacements', () => {
        it('should order bottom-left correctly', () => {
            expect(orderPlacements('bottom-left')).toEqual([
                'bottom-left',
                'bottom',
                'bottom-right',
                'left-bottom',
                'left',
                'left-top',
                'top-left',
                'top',
                'top-right',
                'right-bottom',
                'right',
                'right-top',
            ]);
        });

        it('should order bottom-right correctly', () => {
            expect(orderPlacements('bottom-right')).toEqual([
                'bottom-right',
                'bottom',
                'bottom-left',
                'right-bottom',
                'right',
                'right-top',
                'top-right',
                'top',
                'top-left',
                'left-bottom',
                'left',
                'left-top',
            ]);
        });

        it('should order bottom correctly', () => {
            expect(orderPlacements('bottom')).toEqual([
                'bottom',
                'bottom-left',
                'bottom-right',
                'top',
                'top-left',
                'top-right',
                'left-bottom',
                'right-bottom',
                'left',
                'left-top',
                'right',
                'right-top',
            ]);
        });

        it('should order left-bottom correctly', () => {
            expect(orderPlacements('left-bottom')).toEqual([
                'left-bottom',
                'left',
                'left-top',
                'bottom-left',
                'bottom',
                'bottom-right',
                'right-bottom',
                'right',
                'right-top',
                'top-left',
                'top',
                'top-right',
            ]);
        });

        it('should order left-top correctly', () => {
            expect(orderPlacements('left-top')).toEqual([
                'left-top',
                'left',
                'left-bottom',
                'top-left',
                'top',
                'top-right',
                'right-top',
                'right',
                'right-bottom',
                'bottom-left',
                'bottom',
                'bottom-right',
            ]);
        });

        it('should order top-left correctly', () => {
            expect(orderPlacements('top-left')).toEqual([
                'top-left',
                'top',
                'top-right',
                'left-top',
                'left',
                'left-bottom',
                'bottom-left',
                'bottom',
                'bottom-right',
                'right-top',
                'right',
                'right-bottom',
            ]);
        });
    });
});
