'use client';

import React, { createContext, useContext } from 'react';
import { Agent, DashboardContextData } from '../../lib/types';

interface DashboardContextType {
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
}

const DashboardContext = createContext<DashboardContextType>({
  user: { id: '' },
  isAdmin: false,
  agent: null,
});

export function DashboardProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: DashboardContextType;
}) {
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}
