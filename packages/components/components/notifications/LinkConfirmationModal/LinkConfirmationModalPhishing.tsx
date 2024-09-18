import { c } from 'ttag';

import Checkbox from '@proton/components/components/input/Checkbox';

import { Label } from '../../label';

interface Props {
    link: string;
    value: boolean;
    onToggle: () => void;
}

const LinkConfirmationModalPhishing = ({ link, onToggle, value }: Props) => (
    <>
        {`${c('Info')
            .t`This link leads to a website that might be trying to steal your information, such as passwords and credit card details.`} `}
        <br />
        <span className="text-bold text-break">{link}</span>

        <Label className="flex">
            <Checkbox className="mr-2" checked={value} onChange={onToggle} />
            {c('Label').t`I understand the risk`}
        </Label>
    </>
);

export default LinkConfirmationModalPhishing;
