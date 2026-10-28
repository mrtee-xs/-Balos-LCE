'use client';

import React, { createContext, useContext, useState } from 'react';
import { Agent, SubscriptionTier } from '../../lib/types';

export interface DashboardContextInput {
  user: {
    id: string;
    email?: string;
  };
  isAdmin: boolean;
  name?: string | null;
  role?: string | null;
  email?: string | null;
  agentId?: string | null;
  agent?: Agent | null;
  agencyId?: string | null;
  agencyName?: string | null;
  subscriptionTier?: SubscriptionTier | null;
  subscriptionStatus?: string | null;
  billingCycle?: 'monthly' | 'yearly' | null;
  monthlyConversationLimit?: number | null;
  conversationsUsedThisMonth?: number | null;
  maxWhatsappLines?: number | null;
}

interface DashboardContextType extends DashboardContextInput {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const DashboardContext = createContext<DashboardContextType>({
  user: { id: '' },
  isAdmin: false,
  agent: null,
  mobileMenuOpen: false,
  setMobileMenuOpen: () => {},
});

export function DashboardProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: DashboardContextInput;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <DashboardContext.Provider
      value={{
        ...value,
        mobileMenuOpen,
        setMobileMenuOpen,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}
