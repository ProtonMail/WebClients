import { FileNameDisplay } from '@proton/components';

export const NameCell = ({ name }: { name: string }) => (
    <div className="flex mr1">
        <FileNameDisplay text={name} />
    </div>
);
