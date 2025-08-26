import type { ComponentPropsWithoutRef } from 'react';

import { fireEvent, render } from '@testing-library/react';

import { useAddressesKeys } from '@proton/account/addressKeys/hooks';
import { orderAddresses } from '@proton/account/addresses/actions';
import { useAddresses } from '@proton/account/addresses/hooks';
import { useOrganizationKey } from '@proton/account/organizationKey/hooks';
import { useUser } from '@proton/account/user/hooks';
import OrderableTable from '@proton/components/components/orderableTable/OrderableTable';
import useAddressFlags from '@proton/components/hooks/useAddressFlags';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { ADDRESS_FLAGS, ADDRESS_TYPE } from '@proton/shared/lib/constants';
import type { Address, UserModel } from '@proton/shared/lib/interfaces';
import { mockUseFeatureBarrel } from '@proton/testing/lib/mockUseFeatureBarrel';
import useFlag from '@proton/unleash/useFlag';

import useKTVerifier from '../keyTransparency/useKTVerifier';
import AddressesWithUser from './AddressesWithUser';

jest.mock('@proton/components/hooks/useEventManager', () => () => ({}));

jest.mock('@proton/components/components/upsell/config/useUpsellConfig.ts', () => ({
    __esModule: true,
    default: () => ({}),
}));

jest.mock('@proton/components/hooks/mail/usePostSubscriptionTourTelemetry', () => ({
    __esModule: true,
    usePostSubscriptionTourTelemetry: () => {
        return () => undefined;
    },
}));

jest.mock('@proton/account/addresses/actions');
const mockedOrderAddresses = orderAddresses as jest.MockedFunction<typeof orderAddresses>;

jest.mock('@proton/redux-shared-store/sharedProvider');
const mockedUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;

jest.mock('@proton/shared/lib/helpers/upsell.ts', () => ({ __esModule: true, getUpsellRef: () => '' }));

jest.mock('@proton/components/components/orderableTable/OrderableTable');
const ActualOrderableTable = jest.requireActual('@proton/components/components/orderableTable/OrderableTable').default;
const mockedOrderableTable = OrderableTable as jest.MockedFunction<typeof OrderableTable>;

jest.mock('@proton/account/addresses/hooks');
const mockedUseAddresses = useAddresses as jest.MockedFunction<typeof useAddresses>;

jest.mock('@proton/components/hooks/useAddressFlags');
const mockedUseAddressFlags = useAddressFlags as jest.MockedFunction<typeof useAddressFlags>;

jest.mock('@proton/components/hooks/useNotifications');
const mockedUseNotifications = useNotifications as jest.MockedFunction<typeof useNotifications>;

jest.mock('@proton/account/user/hooks');
const mockedUseUser = useUser as jest.MockedFunction<typeof useUser>;

jest.mock('@proton/account/addressKeys/hooks');
const mockedUseAddressesKeys = useAddressesKeys as jest.MockedFunction<typeof useAddressesKeys>;

jest.mock('@proton/components/containers/keyTransparency/useKTVerifier');
const mockedUseKTVerifier = useKTVerifier as jest.MockedFunction<typeof useKTVerifier>;

jest.mock('@proton/unleash/useFlag');
const mockedUseFlag = useFlag as jest.MockedFunction<any>;

jest.mock('@proton/account/organizationKey/hooks');
const mockedUseOrganizationKey = useOrganizationKey as jest.MockedFunction<typeof useOrganizationKey>;

jest.mock('@proton/components/components/link/SettingsLink', () => 'string');

jest.mock('@proton/redux-shared-store');

jest.mock('@proton/activation/src/hooks/useReconnectSync', () => ({
    __esModule: true,
    default: () => {
        return {
            sync: undefined,
            loadingConfig: false,
            handleReconnect: jest.fn(),
        };
    },
}));

describe('addresses with user', () => {
    const user = { ID: 'abc' } as UserModel;

    const addresses = [
        { ID: '1', Email: 'a@proton.me', Type: ADDRESS_TYPE.TYPE_ORIGINAL, Status: 1, Receive: 1, Send: 1, HasKeys: 1 },
        { ID: '2', Email: 'a@foo.bar', Type: ADDRESS_TYPE.TYPE_EXTERNAL, Status: 1, Receive: 0, Send: 0, HasKeys: 1 },
        {
            ID: '3',
            Email: 'a1@proton.me',
            Type: ADDRESS_TYPE.TYPE_ALIAS,
            Status: 1,
            Receive: 1,
            Send: 1,
            HasKeys: 1,
            Flags: ADDRESS_FLAGS.BYOE,
        },
        { ID: '4', Email: 'a2@pm.me', Type: ADDRESS_TYPE.TYPE_PREMIUM, Status: 0, Receive: 0, Send: 0, HasKeys: 1 },
    ] as Address[];

    mockedUseAddresses.mockReturnValue([addresses, false]);
    mockedOrderableTable.mockImplementation(ActualOrderableTable);
    mockedUseNotifications.mockReturnValue({} as any);
    mockedUseUser.mockReturnValue([{}] as any);
    mockedUseAddressesKeys.mockReturnValue([{}] as any);
    mockedUseKTVerifier.mockReturnValue({} as any);
    mockedUseOrganizationKey.mockReturnValue([{}] as any);
    mockedUseFlag.mockReturnValue(true);
    mockedUseAddressFlags.mockReturnValue({
        data: {
            permissions: {} as any,
        } as any,
        handleSetAddressFlags: async () => {},
    });
    mockUseFeatureBarrel({ feature: { Value: true } as any });

    const getFirstAddress = (container: HTMLElement) => {
        return container.querySelector('[data-testid^="users-and-addresses-table"]');
    };

    it('should be able to set an alias as default', async () => {
        const mockDispatch = jest.fn();
        mockedUseDispatch.mockReturnValue(mockDispatch);

        const { getByTestId, getByText, container } = render(
            <AddressesWithUser user={user} allowAddressDeletion={false} />
        );

        // Assumes that "Make default" is displayed on the address we're interested in
        fireEvent.click(getByTestId('dropdownActions:dropdown'));
        fireEvent.click(getByText('Set as default'));
        const [address1, address2, address3, address4] = addresses;
        expect(mockedOrderAddresses).toHaveBeenCalledWith({
            addresses: [address3, address1, address2, address4],
            member: undefined,
        });
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
            const { container } = render(<AddressesWithUser user={user} allowAddressDeletion={false} />);

            onSortEnd({ newIndex: 0, oldIndex: 2 } as any, {} as any);
            expect(createNotification).toHaveBeenCalledWith({
                type: 'error',
                text: 'An external address cannot be default',
            });
            expect(getFirstAddress(container)?.innerHTML).toBe('a@proton.me');
        });

        it('should not be able to set a disabled address as default', () => {
            const { onSortEnd, createNotification } = setup();
            const { container } = render(<AddressesWithUser user={user} allowAddressDeletion={false} />);

            onSortEnd({ newIndex: 0, oldIndex: 3 } as any, {} as any);
            expect(createNotification).toHaveBeenCalledWith({
                type: 'error',
                text: 'A disabled address cannot be default',
            });
            expect(getFirstAddress(container)?.innerHTML).toBe('a@proton.me');
        });
    });
});
