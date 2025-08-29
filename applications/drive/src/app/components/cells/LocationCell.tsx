import { Icon, TableCell, useActiveBreakpoint } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    location: string;
    isTrashed?: boolean;
}

export const LocationCell = ({ location, isTrashed }: Props) => {
    const { viewportWidth } = useActiveBreakpoint();
    return (
        <TableCell
            className={`flex items-center ${clsx(['m-0', viewportWidth['>=large'] ? 'w-1/5' : 'w-1/4'])}`}
            data-testid="column-location"
        >
            <div key="location" title={location} className="text-ellipsis">
                <span className="text-pre">
                    {isTrashed && <Icon name="trash" className="mr-1" />}
                    {location}
                </span>
            </div>
        </TableCell>
    );
};
