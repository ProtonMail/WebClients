import { c } from 'ttag';

const TaskRunningBanner = () => {
    return (
        <div className="sticky-top bg-norm border-bottom border-weak p0-5 flex flex-wrap flex-justify-center">
            {c('Info').t`A long task running on your messages. They may move around during that time.`}
        </div>
    );
};

export default TaskRunningBanner;
