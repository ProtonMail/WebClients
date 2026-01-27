import { MailLogo } from '@proton/components';

const Header = () => {
    return (
        <header
            className="flex justify-center items-center gap-4 py-4 px-4 md:px-8 max-w-custom md:h-custom justify-space-between mx-auto"
            style={{ '--max-w-custom': '90rem', '--md-h-custom': '4.4rem' }}
        >
            <MailLogo />
        </header>
    );
};

export default Header;
