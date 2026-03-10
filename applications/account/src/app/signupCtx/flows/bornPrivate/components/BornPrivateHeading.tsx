import { c } from 'ttag';

const BornPrivateHeading = () => {
    return (
        <div className="born-private-reservation-heading single-signup-header-v2 text-center mt-2 mb-8">
            <h1 className="m-0 large-font lg:px-4 text-semibold text-wrap-balance">
                {c('Heading').t`A simple step today to ensure your child's digital safety tomorrow`}
            </h1>
        </div>
    );
};

export default BornPrivateHeading;
