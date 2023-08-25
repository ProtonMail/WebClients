import { FileNameDisplay } from '@proton/components';

export const NameCell = ({ name }: { name: string }) => (
    <div className="flex mr-4" data-testid="name-cell">
        <FileNameDisplay text={name} />
    </div>
);
