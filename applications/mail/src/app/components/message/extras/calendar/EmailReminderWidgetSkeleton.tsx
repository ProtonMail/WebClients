import { IconRow } from '@proton/components';

export const EmailReminderWidgetSkeleton = () => (
    <div data-testid="calendar-widget-widget-skeleton">
        <div className="bg-norm rounded border">
            <div className="p1-5">
                <div className="h3 mb0-25 calendar-widget-skeleton calendar-widget-skeleton--title" />
                <p className="text-sm mt0 mb1-5 calendar-widget-skeleton calendar-widget-skeleton--date" />
                <div className="calendar-widget-skeleton calendar-widget-skeleton--link" />
            </div>
            <hr className="mt0-75 mb0" />
            <div className="p1-5">
                <IconRow
                    icon={
                        <div className="calendar-select-color calendar-widget-skeleton calendar-widget-skeleton--icon p0" />
                    }
                    labelClassName="inline-flex pt0-25"
                >
                    <div className="calendar-widget-skeleton calendar-widget-skeleton--details" />
                </IconRow>
            </div>
        </div>
    </div>
);

export default EmailReminderWidgetSkeleton;
