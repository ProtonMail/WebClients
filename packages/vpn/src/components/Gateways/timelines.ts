/**
 * The stretch of time a timeline covers, cut into fixed slots.
 *
 * @example { Start: 1_700_000_000, End: 1_700_001_200, PointSeconds: 300 } — four slots.
 */
export interface GatewayTimelineSpan {
    /** Unix seconds at the start of the first slot. */
    Start: number;
    /** Unix seconds at the end of the last slot, exclusive. */
    End: number;
    /** How many seconds one slot covers. */
    PointSeconds: number;
}

/** One server's readings over the timeline span. */
export interface GatewayServerTimeline {
    ID: string;
    /** The server was deleted from its gateway but still has data in the span. */
    Removed: boolean;
    /** Unix seconds from which this server has been reporting. */
    DataSince: number | null;
    /** The highest value reached inside the span. */
    Peak: number | null;
    /** One slot per entry, in span order. */
    Points: GatewayServerTimelineSlot[];
}

/** One slot of a server's readings. */
interface GatewayServerTimelineSlot {
    /** Average load during the slot, 0 to 100. */
    Average: number | null;
    /** Highest load during the slot, 0 to 100. */
    Peak: number | null;
}

interface GatewayTimelineBase {
    GatewayID: string;
    Window: GatewayTimelineSpan;
    /** The value the dashed capacity line is drawn at. */
    CapacityThreshold: number | null;
    /** Servers in the span before the response truncates them. */
    ServersTotal: number;
    Servers: GatewayServerTimeline[];
}

/** Connected users over the span. */
export interface GatewayConnectedUsersTimeline extends GatewayTimelineBase {
    /** Whether the admin has monitoring on: connected users stop being recorded when it is off. */
    MonitoringOn: boolean;
}

/** The whole timelines response for a gateway. */
export interface GatewayTimelines {
    Load: GatewayTimelineBase;
    ConnectedUsers: GatewayConnectedUsersTimeline;
}

/** One server's drawable line. */
export interface TimelineSeries {
    serverId: string;
    removed: boolean;
    peak: number | null;
    /** The readings to draw, oldest first, gaps cut rather than filled. */
    points: {
        /** Unix seconds at the start of the slot this reading covers. */
        timestamp: number;
        value: number;
    }[];
}
