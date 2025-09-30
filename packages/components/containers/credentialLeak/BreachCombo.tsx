import { c } from 'ttag';

import Pagination from '@proton/components/components/pagination/Pagination';
import usePagination from '@proton/components/components/pagination/usePagination';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';

import type { FetchedBreaches } from './models';

interface Props {
    breachedCombos?: FetchedBreaches['breachedCombos'];
}

const PAGE_SIZE = 10;

const BreachCombo = ({ breachedCombos = [] }: Props) => {
    const { page, list, onNext, onPrevious, onSelect } = usePagination(breachedCombos, 1, PAGE_SIZE);

    const { viewportWidth } = useActiveBreakpoint();
    const isMobileScreen = viewportWidth['<=medium'];

    return (
        <>
            <div className="mb-4">
                <Table className="text-sm" responsive={isMobileScreen ? 'cards' : undefined}>
                    <TableHeader>
                        <TableRow>
                            <TableHeaderCell>{c('Header').t`Domain`}</TableHeaderCell>
                            <TableHeaderCell>{c('Header').t`Username`}</TableHeaderCell>
                            <TableHeaderCell>{c('Header').t`Password ends with`}</TableHeaderCell>
                        </TableRow>
                    </TableHeader>
                    <TableBody colSpan={3}>
                        {list.map((combo) => (
                            <TableRow key={combo.id}>
                                <TableCell
                                    label={isMobileScreen && c('Header').t`Domain`}
                                    className="text-ellipsis"
                                    title={combo.domain}
                                >
                                    {combo.domain}
                                </TableCell>
                                <TableCell
                                    label={isMobileScreen && c('Header').t`Username`}
                                    className="text-ellipsis"
                                    title={combo.username}
                                >
                                    {combo.username}
                                </TableCell>
                                <TableCell
                                    label={isMobileScreen && c('Header').t`Password ends with`}
                                    className="text-ellipsis font-mono"
                                    title={combo.passwordLastChars}
                                >
                                    {combo.passwordLastChars}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {breachedCombos.length > PAGE_SIZE && (
                    <div className="flex justify-center mt-2">
                        <Pagination
                            page={page}
                            total={breachedCombos.length}
                            limit={PAGE_SIZE}
                            onNext={onNext}
                            onPrevious={onPrevious}
                            onSelect={onSelect}
                        />
                    </div>
                )}
            </div>
        </>
    );
};

export default BreachCombo;
