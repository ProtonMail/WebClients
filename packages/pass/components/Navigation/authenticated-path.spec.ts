import { authenticatedPath } from './authenticated-path';

describe('Should append application localID', () => {
    test('should add perfix /u/*/ if we send string', () => {
        expect(authenticatedPath('test-path')).toEqual('/u/*/test-path');
    });

    test('should add perfix /u/*/ if we send string with leading slash', () => {
        expect(authenticatedPath('/test-path')).toEqual('/u/*/test-path');
    });

    test('should add perfix /u/*/ if we send string with leading and tailing slash', () => {
        expect(authenticatedPath('/test-path/')).toEqual('/u/*/test-path');
    });

    test('should add perfix /u/* if we send empty string', () => {
        expect(authenticatedPath('')).toEqual('/u/*');
    });

    test('should add perfix /u/* if we send rooth path', () => {
        expect(authenticatedPath('/')).toEqual('/u/*');
    });

    test('should add perfix /u/* and support variables in the path', () => {
        expect(authenticatedPath('/user/:userId')).toEqual('/u/*/user/:userId');
    });

    test('should add perfix /u/* and support multiple variables in the path', () => {
        expect(authenticatedPath('/user/:userId/next/:nextId')).toEqual('/u/*/user/:userId/next/:nextId');
    });
});
