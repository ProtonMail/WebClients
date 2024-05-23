import { c } from 'ttag';

const NewBadge = () => (
    <span className="px-1 inline-flex rounded color-primary bg-weak border border-weak shrink-0 text-ellipsis text-semibold text-sm mt-1 mx-auto">
        {c('Info').t`New`}
    </span>
);

export default NewBadge;
