import { FileNameDisplay } from '@proton/components';


export const NameCell = ({ name }: { name: string }) => (
    <div className="flex mr-4">
        <FileNameDisplay text={name} />
    </div>
);