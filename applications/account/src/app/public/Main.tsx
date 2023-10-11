import clsx from '@proton/utils/clsx';

interface Props extends React.HTMLProps<HTMLDivElement> {
    center?: boolean;
    disableShadow?: boolean;
    maxWidth?: string;
}

const Main = ({ children, className, center = true, maxWidth = 'mw30r', disableShadow, ...rest }: Props) => {
    return (
        <div
            className={clsx(
                'ui-standard w-full relative sign-layout px-6 pt-1 pb-6 sm:p-11 hardware-accelerated',
                center && 'max-w-full mx-auto',
                disableShadow ? '' : 'sm:shadow-lifted',
                maxWidth ? maxWidth : 'max-w-full',
                className
            )}
            {...rest}
        >
            {children}
        </div>
    );
};

export default Main;
