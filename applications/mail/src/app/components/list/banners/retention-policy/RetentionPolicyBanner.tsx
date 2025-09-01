import { c } from 'ttag';

const RetentionPolicyBanner = () => {
    return (
        <div className="w-full text-center">
            <div className="px-4 py-2 inline-flex mx-auto flex-wrap justify-start items-center">
                <div className="flex-1 pl-1 text-center">
                    {c('Info').t`These conversations are kept here based on your organization's data retention policy.`}
                </div>
            </div>
        </div>
    );
};

export default RetentionPolicyBanner;
