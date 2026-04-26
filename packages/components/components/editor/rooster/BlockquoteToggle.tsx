import { c } from 'ttag';

import { IcThreeDotsHorizontal } from '@proton/icons/icons/IcThreeDotsHorizontal';

interface Props {
    show: boolean | undefined;
    onClick: (() => void) | undefined;
}

const BlockquoteToggle = ({ show = false, onClick = () => {} }: Props) =>
    show ? (
        <button className="proton-toggle-button" type="button" onClick={onClick} id="ellipsis">
            <IcThreeDotsHorizontal size={3.5} className="m-auto" />
            <span className="proton-sr-only">{c('Info').t`Show original message`}</span>
        </button>
    ) : null;

export default BlockquoteToggle;
