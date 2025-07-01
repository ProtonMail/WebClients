import { Button } from '@proton/atoms';
import { Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@proton/components';

import mdx from './Table.mdx';

export default {
    title: 'Components/Table',
    component: Table,
    subcomponents: { TableHeader, TableHeaderCell, TableRow, TableCell, TableBody },
    parameters: {
        docs: {
            page: mdx,
            inlineStories: false,
        },
    },
};

export const Basic = () => {
    return (
        <Table responsive="cards" hasActions>
            <TableHeader>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell label="ID">Lorem ipsum</TableCell>
                    <TableCell label="Name">Lorem ipsum</TableCell>
                    <TableCell>
                        <Button size="small">Loremium</Button>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell label="ID">Lorem ipsum</TableCell>
                    <TableCell label="Name">Lorem ipsum</TableCell>
                    <TableCell>
                        <Button size="small">Loremium</Button>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell label="ID">Lorem ipsum</TableCell>
                    <TableCell label="Name">Lorem ipsum</TableCell>
                    <TableCell>
                        <Button size="small">Loremium</Button>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
};

Basic.parameters = {
    docs: {
        iframeHeight: '300px',
    },
};

export const Cards = () => {
    return (
        <Table responsive="cards">
            <TableHeader>
                <TableHeaderCell>ID</TableHeaderCell>
                <TableHeaderCell>Name</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
            </TableHeader>
            <TableBody>
                <TableRow>
                    <TableCell label="ID">Lorem ipsum</TableCell>
                    <TableCell label="Name">Lorem ipsum</TableCell>
                    <TableCell>
                        <Button size="small">Settings</Button>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell label="ID">Lorem ipsum</TableCell>
                    <TableCell label="Name">Lorem ipsum</TableCell>
                    <TableCell>
                        <Button size="small">Settings</Button>
                    </TableCell>
                </TableRow>
                <TableRow>
                    <TableCell label="ID">Lorem ipsum</TableCell>
                    <TableCell label="Name">Lorem ipsum</TableCell>
                    <TableCell>
                        <Button size="small">Settings</Button>
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
    );
};

Cards.parameters = {
    docs: {
        iframeHeight: '500px',
    },
};
