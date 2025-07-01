import { Table, TableBody, TableCell, TableHeader, TableRow } from '@proton/components';

import mdx from './Shadow.mdx';

export default {
    title: 'CSS Utilities/Shadow',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Shadow = () => {
    return (
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
                        <span className="inline-block shadow-norm w-custom" style={{ '--w-custom': '3em' }}>
                            &nbsp;
                        </span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <code>shadow-raised</code>
                    </TableCell>
                    <TableCell>
                        Applies a <code>--shadow-raised</code> shadow on an element.
                        <br />
                        Should only be applied on lifted and out of flow elements, such as modals or tooltips.
                    </TableCell>
                    <TableCell className="text-right">
                        <span className="inline-block shadow-raised w-custom" style={{ '--w-custom': '3em' }}>
                            &nbsp;
                        </span>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell>
                        <code>shadow-lifted</code>
                    </TableCell>
                    <TableCell>
                        Applies a <code>--shadow-lifted</code> shadow on an element.
                        <br />
                        Should only be applied on lifted and out of flow elements, such as modals or tooltips.
                    </TableCell>
                    <TableCell className="text-right">
                        <span className="inline-block shadow-lifted w-custom" style={{ '--w-custom': '3em' }}>
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
                            style={{ '--w-custom': '3em' }}
                        >
                            &nbsp;
                        </span>
                        <span
                            className="inline-block shadow-lifted shadow-color-primary w-custom"
                            style={{ '--w-custom': '3em' }}
                        >
                            &nbsp;
                        </span>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
};

// ## Example

// Applies the common box shadow on this element.

// <Source
//     language="html"
//     format
//     code={`
// <div className="shadow-norm">Lorem ipsum dolor sit amet</div>
// `}
// />
