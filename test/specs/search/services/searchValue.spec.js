import _ from 'lodash';

import service from '../../../../src/app/search/services/searchValue';
import searchModelService from '../../../../src/app/search/factories/searchModel';
import { MAILBOX_IDENTIFIERS } from '../../../../src/app/constants';

const gettextCatalog = {
    getString: _.identity
};

const labelsModel = {
    get: () => []
};

const translator = (cb) => cb();


describe('SearchValue service', () => {

    const tests = [
        {
            input: '',
            output: {}
        },
        {
            input: 'from:dew@pm.me',
            output: {from: 'dew@pm.me'}
        },
        {
            input: 'keyword: from:dew@pm.me',
            output: {from: 'dew@pm.me'}
        },
        {
            input: 'keyword:dew begin:2018060',
            output: {
                keyword: 'dew',
                begin: '2018060'
            }
        },
        {
            input: 'in:Drafts keyword:dew begin:20180605',
            output: {
                keyword: 'dew',
                label: '1',
                begin: '20180605'
            }
        },
        {
            input: 'in:Drafts keyword:dew to:dew2@pm.me begin:20180605 end:20180608',
            output: {
                keyword: 'dew',
                to: 'dew2@pm.me',
                label: '1',
                begin: '20180605',
                end: '20180608'
            }
        },
        {
            input: 'keyword:dew from:dew@pm.me to:dew2@pm.me begin:20180605 end:20180608',
            output: {
                keyword: 'dew',
                to: 'dew2@pm.me',
                from: 'dew@pm.me',
                begin: '20180605',
                end: '20180608'
            }
        },
        {
            input: 'keyword:jeanne de terre from:dew@pm.me',
            output: {
                keyword: 'jeanne de terre',
                from: 'dew@pm.me'
            }
        },
        {
            input: 'keyword:jeanne de begin de from sur la terre from:dew@pm.me end:20180601',
            output: {
                keyword: 'jeanne de begin de from sur la terre',
                from: 'dew@pm.me',
                end: '20180601'
            }
        }
    ];

    describe('Extract search parameters', () => {
        let parser;
        let searchModel;
        let folders;
        const ghost = window.moment;
        beforeEach(() => {
            window.moment = (input) => ({ unix: () => input });
            searchModel = searchModelService(() => ({}), gettextCatalog, labelsModel, translator);
            parser = service({}).extractParameters;
            folders = searchModel.getFolderList();
        });

        tests.forEach(({ input, output }, index) => {
            it(`should parse the search input string:${index}`, () => {
                expect(parser(input, folders)).toEqual(output);
            });
        });

        afterEach(() => {
            window.moment = ghost;
        });
    });

});
