import { c } from 'ttag';

const TaskRunningBanner = () => {
    return (
        <div className="sticky-top bg-norm border-bottom border-weak p0-5 flex flex-wrap flex-justify-center">
            {c('Info').t`Task running`}
        </div>
    );
};

export default TaskRunningBanner;
