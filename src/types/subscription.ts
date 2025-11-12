export interface SubscriptionData {
  subscription_end_date: string | null;
  talktime_left: number;
  tokens_left: number;
  message?: string;
  plan_type: 'paid' | 'free_trial';
}
