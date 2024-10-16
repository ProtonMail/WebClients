export type CancelSubscriptionResult =
    | {
          status: 'kept';
      }
    | {
          status: 'cancelled';
      }
    | {
          status: 'downgraded';
      }
    | {
          status: 'upsold';
      };
