import { Table, TableBody, TableCell, TableHeader, TableRow } from '@proton/components';

import { getTitle } from '../../helpers/title';
import mdx from './Gap.mdx';

export default {
    title: getTitle(__filename, false),
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

const sizes = [
    {
        class: '0',
        rem: '0',
        px: '0',
    },
    {
        class: 'px',
        rem: '0.0625rem',
        px: '1',
    },
    {
        class: '0.5',
        rem: '0.125rem',
        px: '2px',
    },
    {
        class: '1',
        rem: '0.25rem',
        px: '4px',
    },
    {
        class: '2',
        rem: '0.5rem',
        px: '8px',
    },
    {
        class: '3',
        rem: '0.75rem',
        px: '12px',
    },
    {
        class: '4',
        rem: '1rem',
        px: '16px',
    },
    {
        class: '5',
        rem: '1.25rem',
        px: '20px',
    },
    {
        class: '6',
        rem: '1.5rem',
        px: '24px',
    },
    {
        class: '8',
        rem: '2rem',
        px: '32px',
    },
    {
        class: '10',
        rem: '2.5rem',
        px: '40px',
    },
    {
        class: '11',
        rem: '2.75rem',
        px: '44px',
    },
    {
        class: '12',
        rem: '3rem',
        px: '48px',
    },
    {
        class: '14',
        rem: '3.5rem',
        px: '56px',
    },
];

export const GapTable = () => {
    return (
        <Table className="color-norm">
            <TableHeader>
                <TableRow>
                    <TableCell type="header">Name</TableCell>
                    <TableCell type="header">REM value</TableCell>
                    <TableCell type="header">PX value</TableCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                {sizes.map((item) => (
                    <TableRow key={item.class}>
                        <TableCell>
                            <code>gap-{item.class}</code>
                        </TableCell>
                        <TableCell>{item.rem}</TableCell>
                        <TableCell>{item.px}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};

const demoItemClasses = 'flex items-center justify-center bg-primary user-select';

const DemoItems = () => {
    return (
        <>
            <div className={demoItemClasses} style={{ width: '2rem', height: '2rem' }}></div>
            <div className={demoItemClasses} style={{ width: '2rem', height: '2rem' }}></div>
            <div className={demoItemClasses} style={{ width: '2rem', height: '2rem' }}></div>
            <div className={demoItemClasses} style={{ width: '2rem', height: '2rem' }}></div>
            <div className={demoItemClasses} style={{ width: '2rem', height: '2rem' }}></div>
            <div className={demoItemClasses} style={{ width: '2rem', height: '2rem' }}></div>
            <div className={demoItemClasses} style={{ width: '2rem', height: '2rem' }}></div>
            <div className={demoItemClasses} style={{ width: '2rem', height: '2rem' }}></div>
            <div className={demoItemClasses} style={{ width: '2rem', height: '2rem' }}></div>
        </>
    );
};

export const Gap = () => {
    return (
        <div className="w-full relative flex gap-4">
            {sizes.map((size) => (
                <div key={size.class} className="border rounded w-1/3 flex flex-column items-center gap-2 p-2">
                    <span className="text-2xs">gap-{size.class}</span>
                    <div
                        className={`gap-${size.class}`}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gridTemplateRows: 'repeat(3, 1fr)',
                        }}
                    >
                        <DemoItems />
                    </div>
                </div>
            ))}
        </div>
    );
};

export const GapY = () => {
    return (
        <div className="w-full relative flex gap-4">
            {sizes.map((size) => (
                <div key={size.class} className="border rounded w-1/3 flex flex-column items-center gap-2 p-2">
                    <span className="text-2xs">gap-y-{size.class}</span>
                    <div
                        className={`gap-y-${size.class}`}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gridTemplateRows: 'repeat(3, 1fr)',
                        }}
                    >
                        <DemoItems />
                    </div>
                </div>
            ))}
        </div>
    );
};

export const GapX = () => {
    return (
        <div className="w-full relative flex gap-4">
            {sizes.map((size) => (
                <div key={size.class} className="border rounded w-1/3 flex flex-column items-center gap-2 p-2">
                    <span className="text-2xs">gap-x-{size.class}</span>
                    <div
                        className={`gap-x-${size.class}`}
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gridTemplateRows: 'repeat(3, 1fr)',
                        }}
                    >
                        <DemoItems />
                    </div>
                </div>
            ))}
        </div>
    );
};

export const Responsive = () => {
    return (
        <div className="w-full relative flex gap-4">
            <div
                className={`gap-2 sm:gap-4 md:gap-8 lg:gap-10 xl:gap-14`}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)' }}
            >
                <DemoItems />
            </div>
        </div>
    );
};

Responsive.parameters = {
    docs: {
        iframeHeight: '200px',
        inlineStories: false,
    },
    layout: 'fullscreen',
};
