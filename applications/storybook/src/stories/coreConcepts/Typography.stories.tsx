import { Table, TableBody, TableCell, TableHeader, TableRow } from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './Typography.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Font = () => (
    <>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableCell type="header">Demonstration</TableCell>
                    <TableCell type="header" className="w50">
                        Usage
                    </TableCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>
                        <p>Lorem ipsum</p>
                    </TableCell>
                    <TableCell>regular</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <p className="text-semibold">Lorem ipsum</p>
                    </TableCell>
                    <TableCell>
                        <code>.text-semibold</code>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <p className="text-bold">Lorem ipsum</p>
                    </TableCell>
                    <TableCell>
                        <code>.text-bold</code>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    </>
);

export const Headings = () => (
    <>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableCell type="header">Demonstration</TableCell>
                    <TableCell type="header" className="w50">
                        Usage
                    </TableCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>
                        <h1>Lorem ipsum</h1>
                    </TableCell>
                    <TableCell>H1</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <h2>Lorem ipsum</h2>
                    </TableCell>
                    <TableCell>H2</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <h3>Lorem ipsum</h3>
                    </TableCell>
                    <TableCell>H3</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <h4>Lorem ipsum</h4>
                    </TableCell>
                    <TableCell>H4</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <h5>Lorem ipsum</h5>
                    </TableCell>
                    <TableCell>H5</TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <h6>Lorem ipsum</h6>
                    </TableCell>
                    <TableCell>H6</TableCell>
                </TableRow>
            </TableBody>
        </Table>
    </>
);

export const Text = () => (
    <>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableCell type="header">Demonstration</TableCell>
                    <TableCell type="header" className="w50">
                        Usage
                    </TableCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>
                        <p>Lorem ipsum</p>
                    </TableCell>
                    <TableCell>
                        <span className="block">14px ($base-font-size)</span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <p className="text-4xl">Lorem ipsum</p>
                    </TableCell>
                    <TableCell>
                        <span className="block">
                            Class: <code>.text-4xl</code>
                        </span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <p className="text-3xl">Lorem ipsum</p>
                    </TableCell>
                    <TableCell>
                        <span className="block">
                            Class: <code>.text-3xl</code>
                        </span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <p className="text-2xl">Lorem ipsum</p>
                    </TableCell>
                    <TableCell>
                        <span className="block">
                            Class: <code>.text-2xl</code>
                        </span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <p className="text-xl">Lorem ipsum</p>
                    </TableCell>
                    <TableCell>
                        <span className="block">
                            Class: <code>.text-xl</code>
                        </span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <p className="text-lg">Lorem ipsum</p>
                    </TableCell>
                    <TableCell>
                        <span className="block">
                            Class: <code>.text-lg</code>
                        </span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <p className="text-rg">Lorem ipsum</p>
                    </TableCell>
                    <TableCell>
                        <span className="block">
                            Class: <code>.text-rg</code>
                        </span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <p className="text-sm">Lorem ipsum</p>
                    </TableCell>
                    <TableCell>
                        <span className="block">
                            Class: <code>.text-sm</code>
                        </span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <p className="text-xs">Lorem ipsum</p>
                    </TableCell>
                    <TableCell>
                        <span className="block">
                            Class: <code>.text-xs</code>
                        </span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <p className="text-2xs">Lorem ipsum</p>
                    </TableCell>
                    <TableCell>
                        <span className="block">
                            Class: <code>.text-2xs</code>
                        </span>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    </>
);

export const Colors = () => (
    <>
        <h4>On ui-standard background</h4>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableCell type="header">Demonstration</TableCell>
                    <TableCell type="header" className="w50">
                        Usage
                    </TableCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>Lorem ipsum</TableCell>
                    <TableCell>
                        <span className="block">
                            Class: <code>.color-norm</code>
                        </span>
                        <span className="block">
                            Variable: <code>--text-norm</code>
                        </span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <span className="color-weak">Lorem ipsum</span>
                    </TableCell>
                    <TableCell>
                        <span className="block">
                            Class: <code>.color-weak</code>
                        </span>
                        <span className="block">
                            Variable: <code>--text-weak</code>
                        </span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <span className="color-hint">Lorem ipsum</span>
                    </TableCell>
                    <TableCell>
                        <span className="block">
                            Class: <code>.color-hint</code>
                        </span>
                        <span className="block">
                            Variable: <code>--text-hint</code>
                        </span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <span className="color-disabled">Lorem ipsum</span>
                    </TableCell>
                    <TableCell>
                        <span className="block">
                            Class: <code>.color-disabled</code>
                        </span>
                        <span className="block">
                            Variable: <code>--text-disabled</code>
                        </span>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
        <h4>On ui-prominent background</h4>
        <Table className="ui-prominent">
            <TableHeader>
                <TableRow>
                    <TableCell type="header">Demonstration</TableCell>
                    <TableCell type="header" className="w50">
                        Usage
                    </TableCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell>Lorem ipsum</TableCell>
                    <TableCell>
                        <span className="block">
                            Class: <code>.color-norm</code>
                        </span>
                        <span className="block">
                            Variable: <code>--text-norm</code>
                        </span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <span className="color-weak">Lorem ipsum</span>
                    </TableCell>
                    <TableCell>
                        <span className="block">
                            Class: <code>.color-weak</code>
                        </span>
                        <span className="block">
                            Variable: <code>--text-weak</code>
                        </span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <span className="color-hint">Lorem ipsum</span>
                    </TableCell>
                    <TableCell>
                        <span className="block">
                            Class: <code>.color-hint</code>
                        </span>
                        <span className="block">
                            Variable: <code>--text-hint</code>
                        </span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <span className="color-disabled">Lorem ipsum</span>
                    </TableCell>
                    <TableCell>
                        <span className="block">
                            Class: <code>.color-disabled</code>
                        </span>
                        <span className="block">
                            Variable: <code>--text-disabled</code>
                        </span>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    </>
);
