import type { CSSProperties, ComponentProps, ReactNode } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '@proton/atoms/Button/Button';
import { DashboardCard, DashboardCardContent } from '@proton/atoms/DashboardCard/DashboardCard';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';

type TableProps = ComponentProps<typeof Table>;

const rows = [
    { id: '1', name: 'Alice Anderson', email: 'alice.anderson@proton.me' },
    { id: '2', name: 'Bob Brown', email: 'bob.brown@proton.me' },
    { id: '3', name: 'Charlie Clark', email: 'charlie.clark@proton.me' },
];

const SampleTable = ({ loading, ...props }: Omit<TableProps, 'children'> & { loading?: boolean }) => {
    // Cell labels are for the responsive layouts; a table that never stacks shows them inline
    const label = (text: string) => (props.responsive ? text : undefined);

    return (
        <Table {...props}>
            <TableHeader>
                <TableRow>
                    <TableHeaderCell className="w-1/3">Name</TableHeaderCell>
                    <TableHeaderCell>Email</TableHeaderCell>
                    <TableHeaderCell>
                        <span className="sr-only">Action</span>
                    </TableHeaderCell>
                </TableRow>
            </TableHeader>
            <TableBody loading={loading} colSpan={3}>
                {rows.map(({ id, name, email }) => (
                    <TableRow key={id}>
                        <TableCell label={label('Name')}>{name}</TableCell>
                        <TableCell label={label('Email')}>{email}</TableCell>
                        <TableCell className="text-left-when-stacked">
                            <Button size="small" shape="outline">
                                Edit
                            </Button>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

/** Responsive tables react to their container's width (a container query), not the viewport's. */
const Narrow = ({ children }: { children: ReactNode }) => (
    <div className="w-custom max-w-full" style={{ '--w-custom': '22rem' }}>
        {children}
    </div>
);

const Card = ({ children, flush }: { children: ReactNode; flush?: boolean }) => (
    <div className="bg-weak p-4">
        <DashboardCard>
            <DashboardCardContent paddingClass={flush ? 'p-0' : undefined}>{children}</DashboardCardContent>
        </DashboardCard>
    </div>
);

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
                    'A table composed of `Table`, `TableHeader`, `TableHeaderCell`, `TableBody`, `TableRow` and `TableCell`.\n\n' +
                    '**Responsive layouts** — `responsive="cards"` turns each row into a bordered card, `responsive="stacked"` stacks the cells of each row with a divider between rows. Both apply when the table container is narrower than 35rem, or 50rem with `responsiveBreakpoint="wide"`. Use `text-left-when-stacked` on a cell to align its content to the start once stacked.\n\n' +
                    '**Options** — `hasActions` aligns the last column to the end, `borderWeak` uses the weak border colour, `lastRowNoBorder` removes the line under the last row, `noInlinePadding` removes the inline padding of the first and last columns, and `TableBody loading` shows a busy row.\n\n' +
                    '**CSS variables**, set through `style`:\n' +
                    '- `--table-padding` (default `var(--space-2)`): cell padding.\n' +
                    '- `--table-stacked-padding-inline` (default `0`): inline padding of cells once stacked.\n' +
                    '- `--table-stacked-padding-block-start` (default `0`): space above the first row once stacked.\n\n' +
                    'Use the stacked variables when the table sits flush in a card (`DashboardCardContent paddingClass="p-0"`), so the content keeps its padding at every width.',
            },
        },
    },
    args: {
        caption: 'Members',
        responsive: undefined,
        responsiveBreakpoint: 'normal',
        hasActions: true,
        borderWeak: false,
        lastRowNoBorder: false,
        noInlinePadding: false,
    },
    argTypes: {
        responsive: { control: 'inline-radio', options: [undefined, 'cards', 'stacked'] },
        responsiveBreakpoint: { control: 'inline-radio', options: ['normal', 'wide'] },
    },
    render: (args) => <SampleTable {...args} />,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Table>;

export const Default: Story = {};

export const Cards: Story = {
    name: 'Responsive: cards',
    args: { responsive: 'cards' },
    render: (args) => (
        <Narrow>
            <SampleTable {...args} />
        </Narrow>
    ),
};

export const Stacked: Story = {
    name: 'Responsive: stacked',
    args: { responsive: 'stacked', lastRowNoBorder: true },
    render: (args) => (
        <Narrow>
            <SampleTable {...args} />
        </Narrow>
    ),
};

export const WideBreakpoint: Story = {
    name: 'Responsive: wide breakpoint',
    args: { responsive: 'stacked', responsiveBreakpoint: 'wide' },
    render: (args) => (
        <div className="w-custom max-w-full" style={{ '--w-custom': '45rem' }}>
            <SampleTable {...args} />
        </div>
    ),
};

export const BorderWeak: Story = {
    args: { borderWeak: true },
};

export const LastRowNoBorder: Story = {
    args: { lastRowNoBorder: true },
};

export const NoInlinePadding: Story = {
    args: { noInlinePadding: true },
};

export const Loading: Story = {
    render: (args) => <SampleTable {...args} loading />,
};

export const InCard: Story = {
    name: 'In a card',
    args: { responsive: 'stacked', lastRowNoBorder: true, noInlinePadding: true },
    render: (args) => (
        <Card>
            <SampleTable {...args} />
        </Card>
    ),
};

const flushStyle: CSSProperties = {
    '--table-padding': 'var(--space-4)',
    '--table-stacked-padding-inline': 'var(--table-padding)',
    '--table-stacked-padding-block-start': 'var(--table-padding)',
};

export const FlushInCard: Story = {
    name: 'Flush in a card, wide and stacked',
    args: { responsive: 'stacked', lastRowNoBorder: true },
    render: (args) => (
        <div className="flex flex-column gap-4">
            <Card flush>
                <SampleTable {...args} style={flushStyle} />
            </Card>
            <Narrow>
                <Card flush>
                    <SampleTable {...args} style={flushStyle} />
                </Card>
            </Narrow>
        </div>
    ),
};
