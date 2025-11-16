import { api } from '../client';

export const guestService = {
  async getGuestToken(referralId?: string): Promise<{ guest_token: string }> {
    try {
      const payload = referralId ? { referral_id: referralId } : {};
      return await api.post('/user/create-token', payload, {
        noAuth: true,
      });
    } catch (error) {
      console.error('Error in getGuestToken:', error);
      throw error;
    }
  },
};
