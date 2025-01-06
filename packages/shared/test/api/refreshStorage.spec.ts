import { cleanupLastRefreshDate, getLastRefreshDate, setLastRefreshDate } from '../../lib/api/helpers/refreshStorage';

describe('refreshStorage', () => {
    afterEach(() => {
        window.localStorage.clear();
    });

    it('should store latest refresh date', async () => {
        const key = '123';
        const date = new Date();
        setLastRefreshDate(key, date);

        const result = getLastRefreshDate(key)!;
        expect(+result).toEqual(+date);
    });

    it('should cleanup old refresh dates', async () => {
        const date = new Date();
        setLastRefreshDate('123', date);

        const oldDate = new Date(Date.UTC(2023));
        setLastRefreshDate('124', oldDate);

        window.localStorage.setItem('foo', '123');
        const barDate = new Date();
        window.localStorage.setItem('bar', `${barDate}`);

        expect(+getLastRefreshDate('124')!).toEqual(+oldDate);

        cleanupLastRefreshDate();

        expect(window.localStorage.getItem('foo')).toBe('123');
        expect(window.localStorage.getItem('bar')).toBe(`${barDate}`);
        expect(getLastRefreshDate('124')).toBeUndefined();
        expect(+getLastRefreshDate('123')!).toEqual(+date);
    });
});
