import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Table, TableBody, TableCell, TableHeader, TableRow } from '@proton/components';

const meta: Meta = {
    title: 'Core Concepts/Typography',
    parameters: {
        docs: {
            description: {
                component:
                    'Typography utilities for Proton apps. Covers font weights, headings, text sizes, text colors, and monospace.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

type CodeProps = {
    children: React.ReactNode;
};

const Code = ({ children }: CodeProps) => (
    <code className="inline-block user-select rounded-sm py-1 px-2 border bg-weak text-norm text-sm">{children}</code>
);

export const Font: Story = {
    render: () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableCell type="header" className="w-1/3">
                        Usage
                    </TableCell>
                    <TableCell type="header">Demonstration</TableCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>
                        <Code>.text-no-bold</Code>
                    </TableCell>
                    <TableCell>
                        <p>Lorem ipsum</p>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <Code>.text-semibold</Code>
                    </TableCell>
                    <TableCell>
                        <p className="text-semibold">Lorem ipsum</p>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <Code>.text-bold</Code> <Code>strong</Code>
                    </TableCell>
                    <TableCell>
                        <p className="text-bold">Lorem ipsum</p>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    ),
};

export const Headings: Story = {
    render: () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableCell type="header" className="w-1/3">
                        Usage
                    </TableCell>
                    <TableCell type="header">Demonstration</TableCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>
                        <Code>h1</Code> <Code>.h1</Code>
                    </TableCell>
                    <TableCell>
                        <h1>Lorem ipsum</h1>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <Code>h2</Code> <Code>.h2</Code>
                    </TableCell>
                    <TableCell>
                        <h2>Lorem ipsum</h2>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <Code>h3</Code> <Code>.h3</Code>
                    </TableCell>
                    <TableCell>
                        <h3>Lorem ipsum</h3>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <Code>h4</Code> <Code>.h4</Code>
                    </TableCell>
                    <TableCell>
                        <h4>Lorem ipsum</h4>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <Code>h5</Code> <Code>.h5</Code>
                    </TableCell>
                    <TableCell>
                        <h5>Lorem ipsum</h5>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <Code>h6</Code> <Code>.h6</Code>
                    </TableCell>
                    <TableCell>
                        <h6>Lorem ipsum</h6>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    ),
};

export const Text: Story = {
    render: () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableCell type="header" className="w-1/3">
                        Usage
                    </TableCell>
                    <TableCell type="header">Demonstration</TableCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>base</TableCell>
                    <TableCell>
                        <p>Lorem ipsum</p>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <Code>.text-4xl</Code>
                    </TableCell>
                    <TableCell>
                        <p className="text-4xl">Lorem ipsum</p>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <Code>.text-3xl</Code>
                    </TableCell>
                    <TableCell>
                        <p className="text-3xl">Lorem ipsum</p>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <Code>.text-2xl</Code>
                    </TableCell>
                    <TableCell>
                        <p className="text-2xl">Lorem ipsum</p>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <Code>.text-xl</Code>
                    </TableCell>
                    <TableCell>
                        <p className="text-xl">Lorem ipsum</p>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <Code>.text-lg</Code>
                    </TableCell>
                    <TableCell>
                        <p className="text-lg">Lorem ipsum</p>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <Code>.text-rg</Code>
                    </TableCell>
                    <TableCell>
                        <p className="text-rg">Lorem ipsum</p>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <Code>.text-sm</Code>
                    </TableCell>
                    <TableCell>
                        <p className="text-sm">Lorem ipsum</p>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <Code>.text-xs</Code>
                    </TableCell>
                    <TableCell>
                        <p className="text-xs">Lorem ipsum</p>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <Code>.text-2xs</Code>
                    </TableCell>
                    <TableCell>
                        <p className="text-2xs">Lorem ipsum</p>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    ),
};

const TypoColorsTable = () => (
    <Table>
        <TableHeader>
            <TableRow>
                <TableCell type="header" className="w-1/3">
                    Usage
                </TableCell>
                <TableCell type="header">Demonstration</TableCell>
            </TableRow>
        </TableHeader>
        <TableBody>
            <TableRow>
                <TableCell>
                    <Code>.color-norm</Code>
                    <br />
                    <Code>var(--text-norm)</Code>
                </TableCell>
                <TableCell>Lorem ipsum</TableCell>
            </TableRow>
            <TableRow>
                <TableCell>
                    <Code>.color-weak</Code>
                    <br />
                    <Code>var(--text-weak)</Code>
                </TableCell>
                <TableCell>
                    <span className="color-weak">Lorem ipsum</span>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell>
                    <Code>.color-hint</Code>
                    <br />
                    <Code>var(--text-hint)</Code>
                </TableCell>
                <TableCell>
                    <span className="color-hint">Lorem ipsum</span>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell>
                    <Code>.color-disabled</Code>
                    <br />
                    <Code>var(--text-disabled)</Code>
                </TableCell>
                <TableCell>
                    <span className="color-disabled">Lorem ipsum</span>
                </TableCell>
            </TableRow>
        </TableBody>
    </Table>
);

export const Colors: Story = {
    render: () => (
        <>
            <h4>On ui-standard background</h4>
            <TypoColorsTable />

            <h4>On ui-prominent background</h4>
            <div className="ui-prominent rounded p-4">
                <TypoColorsTable />
            </div>
        </>
    ),
};

export const Monospace: Story = {
    render: () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableCell type="header" className="w-1/3">
                        Usage
                    </TableCell>
                    <TableCell type="header">Demonstration</TableCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>
                        <Code>.text-monospace</Code>
                    </TableCell>
                    <TableCell>
                        <p className="text-monospace">Lorem ipsum</p>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    ),
};
