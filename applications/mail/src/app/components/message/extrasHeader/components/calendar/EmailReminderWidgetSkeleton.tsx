import { IconRow } from '@proton/components';

export const EmailReminderWidgetSkeleton = () => (
    <div data-testid="calendar-widget-widget-skeleton" className="mb-3">
        <div className="bg-norm rounded border">
            <div className="p-5">
                <div className="h3 mb-1 calendar-widget-skeleton calendar-widget-skeleton--title" />
                <p className="text-sm mt-0 mb-5 calendar-widget-skeleton calendar-widget-skeleton--date" />
                <div className="calendar-widget-skeleton calendar-widget-skeleton--link" />
            </div>
            <hr className="mt-3 mb-0" />
            <div className="p-5">
                <IconRow
                    icon={
                        <div className="calendar-select-color calendar-widget-skeleton calendar-widget-skeleton--icon p-0" />
                    }
                    labelClassName="inline-flex pt-1"
                >
                    <div className="calendar-widget-skeleton calendar-widget-skeleton--details" />
                </IconRow>
            </div>
        </div>
    </div>
);

export default EmailReminderWidgetSkeleton;
