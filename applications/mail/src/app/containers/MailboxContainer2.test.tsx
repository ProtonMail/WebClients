import React from 'react';
import { render, act, fireEvent } from '@testing-library/react';
import MailboxContainer from './MailboxContainer';
import { Location, History } from 'history';
import { CacheProvider } from 'react-components';
import createCache from 'proton-shared/lib/helpers/cache';
import ApiContext from 'react-components/containers/api/apiContext';
import { wait } from 'proton-shared/lib/helpers/promise';
import { STATUS } from 'proton-shared/lib/models/cache';

// require.context
jest.mock('proton-shared/lib/i18n/dateFnLocales.js', () => ({}));
jest.mock('react-components/containers/payments/CardNumberInput.js', () => ({}));
jest.mock('react-components/containers/vpn/OpenVPNConfigurationSection/Country.js', () => ({}));

jest.mock('react-components/containers/eventManager/useEventManager.js', () => () => {
    return {
        subscribe: jest.fn()
    };
});

jest.mock('react-components/containers/notifications/useNotifications.js', () => () => {
    return {
        createNotification: jest.fn()
    };
});

jest.mock('react-components/containers/modals/useModals.js', () => () => {
    return {
        createModal: jest.fn()
    };
});

jest.mock('proton-shared/lib/helpers/setupPmcrypto.js', () => {
    return {
        initMain: jest.fn(),
        initWorker: jest.fn()
    };
});

jest.mock('./ConversationProvider');

const emptyProps = {
    labelID: 'labelID',
    mailSettings: {},
    elementID: 'elementID',
    location: {} as Location,
    history: {} as History,
    onCompose: jest.fn()
};

const api = jest.fn<Promise<any>, any>(async () => {
    // console.log('mocked api', ...args);
    return {};
});
const cache = createCache();

cache.set('User', { status: STATUS.RESOLVED, value: {} });

describe('MailboxContainer', () => {
    it('should match snapshot', async () => {
        const result = render(
            <ApiContext.Provider value={api}>
                <CacheProvider cache={cache}>
                    <MailboxContainer {...emptyProps} />
                </CacheProvider>
            </ApiContext.Provider>
        );
        await act(() => wait(0));

        expect(result).toMatchSnapshot();
    });

    it('should select all', async () => {
        cache.set('User', { status: STATUS.RESOLVED, value: {} });

        api.mockImplementation(async (args: any) => {
            if (args.url === 'conversations') {
                return {
                    Total: 2,
                    Conversations: [
                        { ID: '1', Labels: [{ ID: emptyProps.labelID }] },
                        { ID: '2', Labels: [{ ID: emptyProps.labelID }] }
                    ]
                };
            }

            return {};
        });

        const { container } = render(
            <ApiContext.Provider value={api}>
                <CacheProvider cache={cache}>
                    <MailboxContainer {...emptyProps} />
                </CacheProvider>
            </ApiContext.Provider>
        );
        await act(() => wait(0));

        const checkAll = container.querySelector('.toolbar .pm-checkbox') as Element;
        fireEvent.click(checkAll);

        const allChecks = container.querySelectorAll('input.item-checkbox') as NodeListOf<HTMLInputElement>;
        expect(allChecks.length > 0).toBe(true);

        const checked = [...allChecks].every((oneCheck) => oneCheck.checked);
        expect(checked).toBe(true);
    });
});
