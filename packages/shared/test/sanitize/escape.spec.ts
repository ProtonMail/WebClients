import { escapeForbiddenStyle } from '../../lib/sanitize/escape';

describe('Escape', () => {
    describe('escapeForbiddenStyles', () => {
        it('Should replace absolute styles by relative', () => {
            expect(escapeForbiddenStyle('position: absolute')).toBe('position: relative');
        });

        it('Should replace percentage height by unset', () => {
            expect(escapeForbiddenStyle('height: 100%; min-height: 30% ; max-height:  50%;')).toBe(
                'height: unset; min-height: unset ; max-height:  50%;'
            );
        });

        it('Should not replace percent line-height by unset', () => {
            expect(escapeForbiddenStyle('line-height: 100%;')).toBe('line-height: 100%;');
        });
    });
});
