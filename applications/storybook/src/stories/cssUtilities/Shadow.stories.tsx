import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';

const meta: Meta = {
    title: 'CSS Utilities/Shadow',
    parameters: {
        docs: {
            description: {
                component:
                    'Box shadow utility classes. Includes shadow-norm, shadow-raised, shadow-lifted, and shadow-color-primary.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

export const Default: Story = {
    render: () => (
        <Table className="color-norm">
            <TableHeader>
                <TableRow>
                    <TableCell type="header">Class</TableCell>
                    <TableCell type="header" className="w-1/2">
                        Explanation
                    </TableCell>
                    <TableCell type="header" className="text-right">
                        Quick look
                    </TableCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>
                        <code>shadow-norm</code>
                    </TableCell>
                    <TableCell>
                        Applies a <code>--shadow-norm</code> shadow on an element.
                    </TableCell>
                    <TableCell className="text-right">
                        <span
                            className="inline-block shadow-norm w-custom"
                            style={{ '--w-custom': '3em' } as React.CSSProperties}
                        >
                            &nbsp;
                        </span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <code>shadow-raised</code>
                    </TableCell>
                    <TableCell>
                        Applies a <code>--shadow-raised</code> shadow on an element. For lifted/out-of-flow elements.
                    </TableCell>
                    <TableCell className="text-right">
                        <span
                            className="inline-block shadow-raised w-custom"
                            style={{ '--w-custom': '3em' } as React.CSSProperties}
                        >
                            &nbsp;
                        </span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <code>shadow-lifted</code>
                    </TableCell>
                    <TableCell>
                        Applies a <code>--shadow-lifted</code> shadow on an element. For lifted/out-of-flow elements.
                    </TableCell>
                    <TableCell className="text-right">
                        <span
                            className="inline-block shadow-lifted w-custom"
                            style={{ '--w-custom': '3em' } as React.CSSProperties}
                        >
                            &nbsp;
                        </span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <code>shadow-primary</code>
                    </TableCell>
                    <TableCell>Applies the primary colored shadow on an element.</TableCell>
                    <TableCell className="text-right">
                        <span
                            className="inline-block shadow-norm shadow-color-primary w-custom mr-2"
                            style={{ '--w-custom': '3em' } as React.CSSProperties}
                        >
                            &nbsp;
                        </span>
                        <span
                            className="inline-block shadow-lifted shadow-color-primary w-custom"
                            style={{ '--w-custom': '3em' } as React.CSSProperties}
                        >
                            &nbsp;
                        </span>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    ),
};
