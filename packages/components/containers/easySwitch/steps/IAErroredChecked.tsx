import { Checkbox } from '@proton/components/components';

interface Props {
    id: string;
    children: React.ReactNode;
}

const IADisabledCheckbox = ({ id, children }: Props) => (
    <div className="pt1-5 pb1-5 border-bottom flex label w100 cursor-default color-weak">
        <Checkbox id={id} className="mr0-5 flex-align-self-start" disabled />
        <div className="flex flex-column flex-item-fluid">{children}</div>
    </div>
);

export default IADisabledCheckbox;
