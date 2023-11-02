import { c } from 'ttag';

import {
    Checkbox,
    Field,
    Option,
    Row,
    SelectTwo,
    SortingTableHeader,
    Table,
    TableBody,
    TableRow,
} from '@proton/components/components';
import { SelectChangeEvent } from '@proton/components/components/selectTwo/select';
import { useSortedList } from '@proton/components/hooks';
import { SERVER_FEATURES, SORT_DIRECTION, USER_ROLES } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { GatewayDto } from './GatewayDto';
import { GatewayUser } from './GatewayUser';

interface Props {
    loading: boolean;
    users: readonly GatewayUser[];
    model: Pick<GatewayDto, 'features' | 'userIds'>;
    changeModel: <V extends GatewayDto[K], K extends keyof GatewayDto = keyof GatewayDto>(key: K, value: V) => void;
}

export const GatewayUserSelection = ({ loading, users, model, changeModel }: Props) => {
    const { sortConfig, sortedList, toggleSort } = useSortedList(users as GatewayUser[], {
        key: 'Email',
        direction: SORT_DIRECTION.DESC,
    });

    const handleFeatureChange = ({ value }: SelectChangeEvent<string>) => changeModel('features', Number(value));

    const getSelectToggle = (id: string) =>
        loading
            ? noop
            : () =>
                  changeModel(
                      'userIds',
                      model.userIds.indexOf(id) !== -1
                          ? model.userIds.filter((selected) => selected !== id)
                          : [...model.userIds, id]
                  );

    const selectAllToggle = loading
        ? noop
        : () =>
              changeModel(
                  'userIds',
                  users.every(({ ID }) => model.userIds.indexOf(ID) !== -1) ? [] : users.map(({ ID }) => ID)
              );

    return (
        <>
            <Row>
                <Field>
                    <SelectTwo
                        value={`${model.features & SERVER_FEATURES.DOUBLE_RESTRICTION}`}
                        onChange={handleFeatureChange}
                    >
                        <Option value="0" title={c('Title').t`Every member of the organization can access`}>
                            {c('Option').t`The whole organization`}
                        </Option>
                        <Option
                            value={`${SERVER_FEATURES.DOUBLE_RESTRICTION}`}
                            title={c('Title').t`Custom selection of users`}
                        >
                            {c('Option').t`Select who can access...`}
                        </Option>
                    </SelectTwo>
                </Field>
            </Row>
            {model.features & SERVER_FEATURES.DOUBLE_RESTRICTION ? (
                <Table>
                    <SortingTableHeader
                        config={sortConfig}
                        onToggleSort={toggleSort as any}
                        cells={[
                            {
                                content: (
                                    <Checkbox
                                        className="p-1"
                                        checked={users.every(({ ID }) => model.userIds.indexOf(ID) !== -1)}
                                        onChange={selectAllToggle}
                                    />
                                ),
                                className: 'w-custom',
                                style: { '--w-custom': '5%' },
                            },
                            { key: 'Name', content: c('TableHeader').t`Name`, sorting: true },
                            { key: 'Email', content: c('TableHeader').t`Email`, sorting: true },
                            {
                                key: 'Role',
                                content: c('TableHeader').t`Role`,
                                sorting: true,
                                className: 'w-1/10',
                            },
                        ]}
                    />
                    <TableBody loading={!users} colSpan={4}>
                        {sortedList.map(({ ID, Name, Email, Role, Subscriber }: GatewayUser) => (
                            <TableRow
                                key={`select-user--${ID}`}
                                cells={[
                                    <Checkbox
                                        className="p-1"
                                        checked={model.userIds.indexOf(ID) !== -1}
                                        onChange={getSelectToggle(ID)}
                                    />,
                                    <div className="text-ellipsis">{Name}</div>,
                                    <div className="text-ellipsis">{Email}</div>,
                                    Role === USER_ROLES.ADMIN_ROLE
                                        ? Subscriber
                                            ? /* Current status of a user being admin of their organization */ c('Role')
                                                  .t`Primary admin`
                                            : /* Current status of a user being admin of their organization */ c('Role')
                                                  .t`Admin`
                                        : /* Current status of a user being simple member in their organization */ c(
                                              'Role'
                                          ).t`User`,
                                ]}
                            />
                        ))}
                    </TableBody>
                </Table>
            ) : undefined}
        </>
    );
};

export default GatewayUserSelection;
