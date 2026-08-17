import lumoWordmarkDark from '@proton/styles/assets/img/lumo/lumo-logo-v4-dark.svg';
import lumoWordmark from '@proton/styles/assets/img/lumo/lumo-logo-v4.svg';

interface Props {
    /** Resolved by the caller — this package is product-agnostic and has no theme provider. */
    dark?: boolean;
    /** Rendered height in px; width follows the asset's aspect ratio. */
    height?: number;
    /** Required: the wordmark carries the name, so it is never decorative. */
    alt: string;
    className?: string;
}

const LumoWordmark = ({ dark = false, height = 18, alt, className }: Props) => (
    <img src={dark ? lumoWordmarkDark : lumoWordmark} height={height} alt={alt} className={className} />
);

export default LumoWordmark;
