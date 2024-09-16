import { Checkbox } from '@proton/components';

interface Props {
    id: string;
    children: React.ReactNode;
}

const StepPrepareDisabledCheckbox = ({ id, children }: Props) => (
    <div className="py-5 border-bottom flex label w-full cursor-default color-weak">
        <Checkbox id={id} className="mr-2 self-start" disabled />
        <div className="flex flex-column flex-1">{children}</div>
    </div>
);

export default StepPrepareDisabledCheckbox;
