import { useSearchParams } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * @file useUrlTabs.ts
 * @description URL 標籤頁狀態保持 Hook / URL Tab State Persistence Hook
 * @description_en Synchronizes active tab state with URL query parameters to persist tab upon page reload (F5)
 * @description_zh 將當前標籤頁狀態與 URL Query 參數雙向綁定，確保重新整理 (F5) 時不會遺失狀態
 */

export function useUrlTabs<T extends string>(
  defaultTab: T,
  paramKey: string = 'tab'
): [T, (newTab: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get(paramKey) as T) || defaultTab;

  const setTab = useCallback(
    (newTab: T) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set(paramKey, newTab);
          return next;
        },
        { replace: true }
      );
    },
    [paramKey, setSearchParams]
  );

  return [currentTab, setTab];
}
