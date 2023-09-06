export type CancelSubscriptionResult =
    | {
          status: 'kept';
      }
    | {
          status: 'cancelled';
      };
