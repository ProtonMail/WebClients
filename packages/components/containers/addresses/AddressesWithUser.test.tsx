import { ComponentPropsWithoutRef } from 'react';

import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react';

import { OrderableTable, useAddresses, useApi, useNotifications } from '@proton/components';
import { orderAddress } from '@proton/shared/lib/api/addresses';
import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { Address, UserModel } from '@proton/shared/lib/interfaces';

import AddressesWithUser from './AddressesWithUser';

jest.mock('@proton/components/hooks/useApi');
jest.mock('@proton/components/hooks/useAddresses');
jest.mock('@proton/components/hooks/useNotifications');
jest.mock('@proton/components/hooks/useEventManager', () => () => ({}));
jest.mock('@proton/components/components/orderableTable/OrderableTable');
const ActualOrderableTable = jest.requireActual('@proton/components/components/orderableTable/OrderableTable').default;

const mockedUseAddresses = useAddresses as jest.MockedFunction<typeof useAddresses>;
const mockedUseApi = useApi as jest.MockedFunction<typeof useApi>;
const mockedUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;
const mockedOrderableTable = OrderableTable as jest.MockedFunction<typeof OrderableTable>;

describe('addresses with user', () => {
    const user = {
        ID: 'abc',
    } as UserModel;

    const addresses = [
        {
            ID: '1',
            Email: 'a@proton.me',
            Type: ADDRESS_TYPE.TYPE_ORIGINAL,
            Status: 1,
            Receive: 1,
            Send: 1,
            HasKeys: 1,
        },
        {
            ID: '2',
            Email: 'a@foo.bar',
            Type: ADDRESS_TYPE.TYPE_EXTERNAL,
            Status: 1,
            Receive: 0,
            Send: 0,
            HasKeys: 1,
        },
        {
            ID: '3',
            Email: 'a1@proton.me',
            Type: ADDRESS_TYPE.TYPE_ALIAS,
            Status: 1,
            Receive: 1,
            Send: 1,
            HasKeys: 1,
        },
        {
            ID: '4',
            Email: 'a2@pm.me',
            Type: ADDRESS_TYPE.TYPE_PREMIUM,
            Status: 0,
            Receive: 0,
            Send: 0,
            HasKeys: 1,
        },
    ] as Address[];

    mockedUseAddresses.mockReturnValue([addresses, false, null]);
    mockedOrderableTable.mockImplementation(ActualOrderableTable);
    mockedUseNotifications.mockReturnValue({} as any);

    const getFirstAddress = (container: HTMLElement) => {
        return container.querySelector('[title]');
    };

    it('should be able to set an alias as default', () => {
        const mockApi = jest.fn();
        mockedUseApi.mockReturnValue(mockApi);

        const { getByText, container } = render(<AddressesWithUser user={user} />);

        // Assumes that "Make default" is displayed on on the address we're interested in
        fireEvent.click(getByText('Make default'));
        expect(mockApi).toHaveBeenCalledWith(orderAddress(['3', '1', '2', '4']));
        expect(getFirstAddress(container)?.innerHTML).toBe('a1@proton.me');
    });

    describe('set as default', () => {
        const setup = () => {
            const createNotification = jest.fn();
            mockedUseNotifications.mockReturnValue({ createNotification } as any);
            let onSortEnd: ComponentPropsWithoutRef<typeof OrderableTable>['onSortEnd'];
            mockedOrderableTable.mockImplementation((props) => {
                onSortEnd = props.onSortEnd;
                return <ActualOrderableTable {...props} />;
            });
            const handleSortEnd: typeof onSortEnd = (...args) => {
                onSortEnd?.(...args);
            };
            return { onSortEnd: handleSortEnd, createNotification };
        };

        it('should not be able to set an external address as default', () => {
            const { onSortEnd, createNotification } = setup();
            const { container } = render(<AddressesWithUser user={user} />);

            onSortEnd({ newIndex: 0, oldIndex: 1 } as any, {} as any);
            expect(createNotification).toHaveBeenCalledWith({
                type: 'error',
                text: 'An external address cannot be default',
            });
            expect(getFirstAddress(container)?.innerHTML).toBe('a@proton.me');
        });

        it('should not be able to set a disabled address as default', () => {
            const { onSortEnd, createNotification } = setup();
            const { container } = render(<AddressesWithUser user={user} />);

            onSortEnd({ newIndex: 0, oldIndex: 3 } as any, {} as any);
            expect(createNotification).toHaveBeenCalledWith({
                type: 'error',
                text: 'A disabled address cannot be default',
            });
            expect(getFirstAddress(container)?.innerHTML).toBe('a@proton.me');
        });
    });
});
