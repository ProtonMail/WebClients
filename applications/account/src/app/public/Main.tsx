import clsx from '@proton/utils/clsx';

interface Props extends React.HTMLProps<HTMLDivElement> {
    center?: boolean;
    disableShadow?: boolean;
    padding?: boolean;
}

const Main = ({ padding = true, children, className, center = true, disableShadow, ...rest }: Props) => {
    return (
        <div
            className={clsx(
                'ui-standard w-full max-w-custom relative sign-layout pt-1 pb-6 sm:p-11 hardware-accelerated',
                padding && 'px-6',
                center && 'mx-auto',
                disableShadow ? '' : 'sm:shadow-lifted shadow-color-primary',
                className
            )}
            style={{ '--max-w-custom': '30rem' }}
            {...rest}
        >
            {children}
        </div>
    );
};

export default Main;
