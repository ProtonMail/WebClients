import { FileName } from '../../../FileName';

export const NameCell = ({ name }: { name: string }) => (
    <div className="flex mr-4" data-testid="name-cell">
        <FileName text={name} />
    </div>
);
