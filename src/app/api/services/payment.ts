import type {
  CreatePaymentRequest,
  CreatePaymentResponse,
  DeductTalktimeRequest,
  DeductTalktimeResponse,
  SubscriptionStatusResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
} from '@/types/api';
import { api } from '../client';
import { API_ENDPOINTS } from '../config';

export const paymentService = {
  async createPayment(data: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    try {
      return await api.post<CreatePaymentResponse>(API_ENDPOINTS.PAYMENT.CREATE, data);
    } catch (error) {
      console.error('Error in createPayment:', error);

      throw error;
    }
  },

  async verifyPayment(data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    try {
      return await api.post<VerifyPaymentResponse>(API_ENDPOINTS.PAYMENT.VERIFY, data);
    } catch (error) {
      console.error('Error in verifyPayment:', error);

      throw error;
    }
  },

  async getSubscriptionStatus(): Promise<SubscriptionStatusResponse> {
    try {
      return await api.get<SubscriptionStatusResponse>(API_ENDPOINTS.PAYMENT.SUBSCRIPTION_STATUS);
    } catch (error) {
      console.error('Error in getSubscriptionStatus:', error);

      throw error;
    }
  },

  async deductTalktime(data: DeductTalktimeRequest): Promise<DeductTalktimeResponse> {
    try {
      return await api.post<DeductTalktimeResponse>(API_ENDPOINTS.PAYMENT.DEDUCT_TALKTIME, data);
    } catch (error) {
      console.error('Error in deductTalktime:', error);

      throw error;
    }
  },
};
