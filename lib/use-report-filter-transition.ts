"use client";

import { useEffect, useState, useTransition } from "react";

import type { FilterTab } from "@/lib/report-types";

function getDefaultFilterKey(filters: FilterTab[]) {
  return filters[0]?.key ?? "overall";
}

export function useReportFilterTransition(filters: FilterTab[]) {
  const defaultFilterKey = getDefaultFilterKey(filters);
  const [activeKey, setActiveKey] = useState(defaultFilterKey);
  const [contentKey, setContentKey] = useState(defaultFilterKey);
  const [isPending, startTransition] = useTransition();

  const setFilterKey = (nextKey: string) => {
    if (nextKey === activeKey && nextKey === contentKey) {
      return;
    }

    setActiveKey(nextKey);
    startTransition(() => {
      setContentKey(nextKey);
    });
  };

  useEffect(() => {
    setActiveKey(defaultFilterKey);
    setContentKey(defaultFilterKey);
  }, [defaultFilterKey, filters]);

  return {
    activeKey,
    contentKey,
    isPending,
    setFilterKey,
  };
}
