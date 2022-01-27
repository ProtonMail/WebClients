interface Props {
    show: boolean | undefined;
    onClick: (() => void) | undefined;
}

const BlockquoteToggle = ({ show = false, onClick = () => {} }: Props) =>
    show ? (
        <button type="button" onClick={onClick} id="ellipsis">
            …
        </button>
    ) : null;

export default BlockquoteToggle;
