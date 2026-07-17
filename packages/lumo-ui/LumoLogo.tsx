import lumoCatIcon from '@proton/styles/assets/img/lumo/lumo-cat-icon.svg';

interface Props {
    /** Rendered box size in px. Sized per placement: header ~24–28, reply avatar 28, empty state ~32. */
    size?: number;
    className?: string;
}

/** The Lumo cat mark. One source, sized per placement — decorative, so hidden from assistive tech. */
const LumoLogo = ({ size = 28, className }: Props) => (
    <img src={lumoCatIcon} width={size} height={size} alt="" aria-hidden="true" className={className} />
);

export default LumoLogo;
