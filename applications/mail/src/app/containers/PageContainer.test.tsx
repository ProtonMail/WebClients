import { fireEvent } from '@testing-library/react';

import { getAppName } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';

import {
    addApiMock,
    addToCache,
    assertFocus,
    clearAll,
    minimalCache,
    onCompose,
    render,
    tick,
} from '../helpers/test/helper';
import { Breakpoints } from '../models/utils';
import PageContainer from './PageContainer';

jest.setTimeout(20000);

describe('PageContainer', () => {
    const props = {
        breakpoints: {} as Breakpoints,
        isComposerOpened: false,
    };

    beforeAll(() => {
        global.fetch = jest.fn();
    });

    beforeEach(clearAll);

    const setup = async ({ Component = PageContainer } = {}) => {
        addApiMock('importer/v1/importers', () => ({ Importers: [] }));
        addApiMock('settings/calendar', () => ({}));
        addApiMock('calendar/v1', () => ({}));
        addApiMock('payments/v4/plans', () => ({}));
        addApiMock('mail/v4/conversations', () => ({}));
        addApiMock('domains/optin', () => ({}));
        addApiMock('payments/v4/subscription/latest', () => ({}));
        addApiMock('mail/v4/incomingdefaults', () => ({
            IncomingDefaults: [],
            Total: 0,
            GlobalTotal: 0,
        }));

        minimalCache();
        addToCache('MailSettings', { Shortcuts: 1 });

        const renderResult = await render(<Component {...props} />, false);
        const { container } = renderResult;
        return {
            ...renderResult,
            questionMark: () => fireEvent.keyDown(container, { key: '?' }),
            tab: () => fireEvent.keyDown(container, { key: 'Tab' }),
            slash: () => fireEvent.keyDown(container, { key: '/' }),
            n: () => fireEvent.keyDown(container, { key: 'N' }),
        };
    };

    describe('hotkeys', () => {
        it('should open hotkeys modal on ?', async () => {
            const { questionMark, getByText } = await setup();

            const appName = getAppName(APPS.PROTONMAIL);

            questionMark();

            getByText(`${appName} Keyboard Shortcuts`);
        });

        it('should focus element list on Tab', async () => {
            const Component = () => {
                return (
                    <>
                        <PageContainer {...props} />
                        <div data-shortcut-target="item-container" tabIndex={-1} />
                    </>
                );
            };

            const { tab } = await setup({ Component: Component as any });

            tab();

            const itemContainer = document.querySelector('[data-shortcut-target="item-container"]');

            assertFocus(itemContainer);
        });

        it('should focus search bar on /', async () => {
            const { slash } = await setup();

            slash();

            await tick();

            const search = document.querySelector('[data-shorcut-target="searchbox-field"]');

            assertFocus(search);
        });

        it('should open composer on a N', async () => {
            const { n } = await setup();

            n();

            expect(onCompose).toHaveBeenCalled();
        });
    });
});
