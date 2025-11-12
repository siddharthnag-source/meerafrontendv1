'use client';

import { PricingModal } from '@/components/PricingModal';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { PricingModalSource } from '@/types/pricing';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface PricingModalContextType {
  openModal: (source: PricingModalSource, isClosable?: boolean) => void;
}

const PricingModalContext = createContext<PricingModalContextType | undefined>(undefined);

export const usePricingModal = () => {
  const context = useContext(PricingModalContext);
  if (!context) {
    throw new Error('usePricingModal must be used within a PricingModalProvider');
  }
  return context;
};

export const PricingModalProvider = ({ children }: { children: ReactNode }) => {
  const {
    data: subscriptionData,
    isLoading: isLoadingSubscription,
    isError: isSubscriptionError,
  } = useSubscriptionStatus();

  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [isPricingModalClosable, setIsPricingModalClosable] = useState(true);
  const [modalSource, setModalSource] = useState<PricingModalSource | undefined>();

  // Automatic modal logic
  useEffect(() => {
    if (isLoadingSubscription || isSubscriptionError || !subscriptionData) {
      return;
    }

    const isPaid = subscriptionData.plan_type === 'paid';
    const hasActiveSub = new Date(subscriptionData.subscription_end_date || 0) >= new Date();

    let source: PricingModalSource | undefined;
    let isClosable = true;

    if (isPaid) {
      if (!hasActiveSub) {
        source = 'paid_sub_expired';
        isClosable = true;
      }
    } else {
      // Free trial
      const hasNoTokens = (subscriptionData.tokens_left ?? 0) <= 0;
      const hasNoTalktime = (subscriptionData.talktime_left ?? 0) <= 0;

      isClosable = false; // Non-closable for all free trial limits

      if (!hasActiveSub) {
        source = 'free_trial_expired';
      } else if (hasNoTokens) {
        source = 'free_tokens_expired';
      } else if (hasNoTalktime) {
        source = 'free_talktime_expired';
      }
    }

    if (source) {
      setModalSource(source);
      setIsPricingModalOpen(true);
      setIsPricingModalClosable(isClosable);
    }
  }, [
    subscriptionData,
    isLoadingSubscription,
    isSubscriptionError,
  ]);

  const openModal = useCallback((source: PricingModalSource, isClosable = true) => {
    setModalSource(source);
    setIsPricingModalOpen(true);
    setIsPricingModalClosable(isClosable);
  }, []);

  const closeModal = useCallback(() => {
    setIsPricingModalOpen(false);
  }, []);

  const value = { openModal };

  return (
    <PricingModalContext.Provider value={value}>
      {children}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={closeModal}
        isClosable={isPricingModalClosable}
        source={modalSource}
      />
    </PricingModalContext.Provider>
  );
};
