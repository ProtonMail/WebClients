import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';

interface Props {
    show: boolean | undefined;
    onClick: (() => void) | undefined;
}

const BlockquoteToggle = ({ show = false, onClick = () => {} }: Props) =>
    show ? (
        <button className="proton-toggle-button inline-flex" type="button" onClick={onClick} id="ellipsis">
            <Icon name="three-dots-horizontal" size={3.5} className="m-auto" />
            <span className="proton-sr-only">{c('Info').t`Show original message`}</span>
        </button>
    ) : null;

export default BlockquoteToggle;
