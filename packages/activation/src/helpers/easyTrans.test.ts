import { EasyTrans } from './easyTrans';

describe('Testing instances returned by easy trans', () => {
    it('Should return labelInstance', () => {
        const trans = EasyTrans.get(true).manage();
        expect(trans).toStrictEqual('Manage labels');
    });
    it('Should return folderInstance', () => {
        const trans = EasyTrans.get(false).manage();
        expect(trans).toStrictEqual('Manage folders');
    });
});
