import { ComponentPropsWithoutRef } from 'react';

import { fireEvent, render } from '@testing-library/react';

import {
    OrderableTable,
    useAddresses,
    useAddressesKeys,
    useApi,
    useFlag,
    useKTVerifier,
    useNotifications,
    useUser,
} from '@proton/components';
import { orderAddress } from '@proton/shared/lib/api/addresses';
import { ADDRESS_TYPE } from '@proton/shared/lib/constants';
import { Address, UserModel } from '@proton/shared/lib/interfaces';

import AddressesWithUser from './AddressesWithUser';

jest.mock('@proton/components/hooks/useEventManager', () => () => ({}));

jest.mock('@proton/components/components/orderableTable/OrderableTable');
const ActualOrderableTable = jest.requireActual('@proton/components/components/orderableTable/OrderableTable').default;
const mockedOrderableTable = OrderableTable as jest.MockedFunction<typeof OrderableTable>;

jest.mock('@proton/components/hooks/useAddresses');
const mockedUseAddresses = useAddresses as jest.MockedFunction<typeof useAddresses>;

jest.mock('@proton/components/hooks/useApi');
const mockedUseApi = useApi as jest.MockedFunction<typeof useApi>;

jest.mock('@proton/components/hooks/useNotifications');
const mockedUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

jest.mock('@proton/components/hooks/useUser');
const mockedUseUser = useUser as jest.MockedFunction<typeof useUser>;

jest.mock('@proton/components/hooks/useAddressesKeys');
const mockedUseAddressesKeys = useAddressesKeys as jest.MockedFunction<typeof useAddressesKeys>;

jest.mock('@proton/components/containers/keyTransparency/useKTVerifier');
const mockedUseKTVerifier = useKTVerifier as jest.MockedFunction<typeof useKTVerifier>;

jest.mock('@proton/components/containers/unleash/useFlag');
const mockedUseFlag = useFlag as jest.MockedFunction<any>;

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
    mockedUseUser.mockReturnValue([{}] as any);
    mockedUseAddressesKeys.mockReturnValue([{}] as any);
    mockedUseKTVerifier.mockReturnValue({} as any);
    mockedUseFlag.mockReturnValue(true);

    const getFirstAddress = (container: HTMLElement) => {
        return container.querySelector('[title]');
    };

    it('should be able to set an alias as default', async () => {
        const mockApi = jest.fn();
        mockedUseApi.mockReturnValue(mockApi);

        const { getByTestId, getByText, container } = render(<AddressesWithUser user={user} />);

        // Assumes that "Make default" is displayed on the address we're interested in
        fireEvent.click(getByTestId('dropdownActions:dropdown'));
        fireEvent.click(getByText('Set as default'));
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

            onSortEnd({ newIndex: 0, oldIndex: 2 } as any, {} as any);
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
