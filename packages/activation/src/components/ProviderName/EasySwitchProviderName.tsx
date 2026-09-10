import type { ProviderDisplay } from '../../constants';

interface Props {
    provider: ProviderDisplay;
}

export const EasySwitchProviderName = ({ provider: { getName, logo, width, height }, ...rest }: Props) => {
    return (
        <div className="gap-2 flex">
            <img src={logo} alt="" className="self-center" width={width} height={height} {...rest} />
            <span className="self-center">{getName()}</span>
        </div>
    );
};
