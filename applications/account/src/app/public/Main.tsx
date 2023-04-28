import clsx from '@proton/utils/clsx';

interface Props extends React.HTMLProps<HTMLDivElement> {
    larger?: boolean;
    center?: boolean;
}

const Main = ({ children, className, center = true, larger, ...rest }: Props) => {
    return (
        <main
            className={clsx(
                'ui-standard w100 relative sign-layout shadow-lifted shadow-color-primary on-tiny-mobile-no-box-shadow px-6 pt-1 pb-6 sm:p-11',
                !larger ? 'mw30r' : '',
                center && 'max-w100 mx-auto',
                className
            )}
            {...rest}
        >
            {children}
        </main>
    );
};

export default Main;
