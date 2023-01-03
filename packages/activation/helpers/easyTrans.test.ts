import { EasyTrans } from './easyTrans';

describe('Testing instances returned by easy trans', () => {
    it('Should return labelInstance', () => {
        const trans = EasyTrans.get(true).hide();
        expect(trans).toStrictEqual('Hide labels');
    });
    it('Should return folderInstance', () => {
        const trans = EasyTrans.get(false).hide();
        expect(trans).toStrictEqual('Hide folders');
    });
});
