import clsx from '@proton/utils/clsx';

interface Props extends React.HTMLProps<HTMLDivElement> {
    larger?: boolean;
    center?: boolean;
}

const Main = ({ children, className, center = true, larger, ...rest }: Props) => {
    return (
        <main
            className={clsx(
                'ui-standard w100 relative sign-layout shadow-lifted on-tiny-mobile-no-box-shadow',
                !larger ? 'mw30r' : '',
                center && 'max-w100 center',
                className
            )}
            {...rest}
        >
            {children}
        </main>
    );
};

export default Main;
