import { Table, TableBody, TableCell, TableHeader, TableRow, Tooltip } from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './Sizing.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

const demoItemClasses =
    'user-select flex items-center py-2 justify-center bg-strong rounded-sm text-center text-nowrap';
const demoContainerClasses = 'border p-4 my-4 rounded w-full relative flex flex-column gap-2 overflow-auto text-sm';

export const Fractions = () => {
    const sizes = [
        '1/2',
        '1/2',
        '1/3',
        '2/3',
        '1/4',
        '3/4',
        '2/4',
        '2/4',
        '1/5',
        '4/5',
        '2/5',
        '3/5',
        '1/6',
        '5/6',
        '2/6',
        '4/6',
        '3/6',
        '3/6',
        '1/10',
        '9/10',
        '2/10',
        '8/10',
        '3/10',
        '7/10',
        '4/10',
        '6/10',
        '5/10',
        '5/10',
        'full',
    ];

    return (
        <div className="border py-4 my-4 px-2 rounded w-full relative gap-y-4 flex overflow-auto">
            {sizes.map((size) => (
                <Tooltip
                    title={size === 'full' ? '100%' : `Equivalent to ${Math.round(eval(size) * 10000) / 100}%`}
                    openDelay={0}
                >
                    <div className={`w-${size} px-2`}>
                        <div className={demoItemClasses}>w-{size}</div>
                    </div>
                </Tooltip>
            ))}
        </div>
    );
};

export const FractionsTable = () => {
    return (
        <Table className="color-norm">
            <TableHeader>
                <TableRow>
                    <TableCell type="header" className="w-1/3">
                        Class
                    </TableCell>
                    <TableCell type="header">Property</TableCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                {[2, 3, 4, 5, 6, 10].map((i) =>
                    [...Array(i - 1)].map((_, j) => (
                        <TableRow key={j}>
                            <TableCell>{`w-${j + 1}/${i}`}</TableCell>
                            <TableCell>
                                <code>inline-size: {Math.round(((j + 1) / i) * 10000) / 100}%;</code>
                            </TableCell>
                        </TableRow>
                    ))
                )}
                <TableRow>
                    <TableCell>w-full</TableCell>
                    <TableCell>
                        <code>inline-size: 100%;</code>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
};

export const Responsive = () => {
    return (
        <div className="border py-4 px-2 rounded w-full relative gap-y-4 flex overflow-auto">
            <div className="w-full sm:w-1/2 md:w-2/3 lg:w-1/4 px-2">
                <div className={demoItemClasses}>item</div>
            </div>
            <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 px-2">
                <div className={demoItemClasses}>item</div>
            </div>
            <div className="w-full sm:w-1/2 md:w-1/3 lg:w-1/4 px-2">
                <div className={demoItemClasses}>item</div>
            </div>
            <div className="w-full sm:w-1/2 md:w-2/3 lg:w-1/4 px-2">
                <div className={demoItemClasses}>item</div>
            </div>
        </div>
    );
};

Responsive.parameters = {
    docs: {
        iframeHeight: '250px',
        inlineStories: false,
    },
    layout: 'fullscreen',
};

export const Framework = () => {
    const sizes = [0, 'px', 2, 4, 'full', 'auto'];

    return (
        <div className={demoContainerClasses}>
            {sizes.map((size) => (
                <div className={`${demoItemClasses} w-${size}`}>
                    <span className={`${size === 'full' || size === 'auto' ? '' : 'color-norm relative ml-8'}`}>
                        w-{size}
                    </span>
                </div>
            ))}
        </div>
    );
};
