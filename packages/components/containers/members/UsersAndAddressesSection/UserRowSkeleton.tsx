import SkeletonLoader from '../../../components/skeletonLoader/SkeletonLoader';
import TableCell from '../../../components/table/TableCell';
import TableRow from '../../../components/table/TableRow';

const UserRowSkeleton = () => (
    <TableRow>
        <TableCell>
            <div className="flex items-center gap-3 w-full">
                <SkeletonLoader width="2em" height="2em" />
                <SkeletonLoader className="flex-1" height="1em" />
            </div>
        </TableCell>
        <TableCell>
            <SkeletonLoader width="100%" height="1em" />
        </TableCell>
        <TableCell>
            <SkeletonLoader width="100%" height="1em" />
        </TableCell>
        <TableCell>
            <SkeletonLoader width="100%" height="1em" className="my-1" />
            <SkeletonLoader width="100%" height="1em" className="my-1" />
        </TableCell>
        <TableCell>
            <SkeletonLoader width="100%" height="1em" />
        </TableCell>
    </TableRow>
);

export default UserRowSkeleton;
