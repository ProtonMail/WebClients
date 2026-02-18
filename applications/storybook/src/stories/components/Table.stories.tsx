import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '@proton/atoms/Button/Button';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';

const meta: Meta<typeof Table> = {
    title: 'Components/Table',
    component: Table,
    subcomponents: {
        TableHeader: TableHeader as any,
        TableHeaderCell: TableHeaderCell as any,
        TableBody: TableBody as any,
        TableRow: TableRow as any,
        TableCell: TableCell as any,
    },
    parameters: {
        docs: {
            description: {
                component:
                    'A table component composed of Table, TableHeader, TableHeaderCell, TableBody, TableRow, and TableCell. Supports responsive card layout and action columns.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Table>;

export const Default: Story = {
    render: () => (
        <Table responsive="cards" hasActions>
            <TableHeader>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
            </TableHeader>
            <TableBody>
                {['Row 1', 'Row 2', 'Row 3'].map((row) => (
                    <TableRow key={row}>
                        <TableCell label="ID">{row}</TableCell>
                        <TableCell label="Name">Lorem ipsum</TableCell>
                        <TableCell>
                            <Button size="small">Loremium</Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    ),
};

export const Cards: Story = {
    render: () => (
        <Table responsive="cards">
            <TableHeader>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
            </TableHeader>
            <TableBody>
                {['Row 1', 'Row 2', 'Row 3'].map((row) => (
                    <TableRow key={row}>
                        <TableCell label="ID">{row}</TableCell>
                        <TableCell label="Name">Lorem ipsum</TableCell>
                        <TableCell>
                            <Button size="small">Settings</Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    ),
};
