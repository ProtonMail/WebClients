import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import type { IconProps } from '@proton/components/components/icon/Icon';

import './OptionButton.scss';

interface OptionButtonProps {
    showIcon: boolean;
    label: string;
    onClick: () => void;
    Icon: (props: Pick<IconProps, 'size'>) => JSX.Element;
    iconSize?: IconProps['size'];
    loading?: boolean;
}

export const OptionButton = ({ showIcon, label, onClick, Icon, iconSize, loading }: OptionButtonProps) => {
    return (
        <Button
            className="option-button w-full max-w-custom flex items-center justify-start flex-nowrap pl-0 text-lg meet-font-weight rounded-xl"
            onClick={onClick}
            shape="ghost"
            style={{ '--max-w-custom': '25rem' }}
        >
            <div
                className="flex items-center justify-center w-custom min-w-custom w-4 mr-2"
                style={{ '--w-custom': '2rem', '--min-w-custom': '2rem' }}
            >
                {loading ? <CircleLoader /> : showIcon && Icon && <Icon size={iconSize ?? 5} />}
            </div>
            <span className="text-ellipsis">{label}</span>
        </Button>
    );
};
