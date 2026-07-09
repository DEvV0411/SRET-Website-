import { useState, useCallback } from 'react';
import { db } from '../lib/db';
import type { DashboardWidgetConfig } from '../types';

export type { DashboardWidgetConfig as WidgetConfig };

export interface WidgetDefault {
  id: string;
  visible: boolean;
}

function loadConfig(
  defaults: WidgetDefault[],
  username: string,
  dashboardKey: string
): DashboardWidgetConfig[] {
  const saved = db.getDashboardLayout(username, dashboardKey);
  if (saved?.widgets?.length) {
    // Merge: add any new default widgets not yet in the saved config
    const savedIds = new Set(saved.widgets.map(w => w.id));
    const missing = defaults
      .filter(d => !savedIds.has(d.id))
      .map((d, i) => ({ id: d.id, visible: d.visible, order: saved.widgets.length + i }));
    return [...saved.widgets, ...missing];
  }
  return defaults.map((w, i) => ({ id: w.id, visible: w.visible, order: i }));
}

export function useDashboardLayout(
  defaults: WidgetDefault[],
  username: string,
  dashboardKey: string
) {
  const [config, setConfig] = useState<DashboardWidgetConfig[]>(() =>
    loadConfig(defaults, username, dashboardKey)
  );
  const [showCustomiser, setShowCustomiser] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);

  /** Returns widget ids in their current user-defined order */
  const orderedIds = [...config].sort((a, b) => a.order - b.order).map(c => c.id);

  /** Returns true if widget `id` should be rendered */
  const isVisible = useCallback(
    (id: string) => config.find(c => c.id === id)?.visible ?? true,
    [config]
  );

  const toggleVisible = (id: string) => {
    setConfig(prev => prev.map(c => (c.id === id ? { ...c, visible: !c.visible } : c)));
    setHasUnsaved(true);
  };

  const moveUp = (id: string) => {
    setConfig(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex(c => c.id === id);
      if (idx <= 0) return prev;
      const next = [...sorted];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next.map((c, i) => ({ ...c, order: i }));
    });
    setHasUnsaved(true);
  };

  const moveDown = (id: string) => {
    setConfig(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex(c => c.id === id);
      if (idx >= sorted.length - 1) return prev;
      const next = [...sorted];
      [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
      return next.map((c, i) => ({ ...c, order: i }));
    });
    setHasUnsaved(true);
  };

  /** Persists the layout to DB (localStorage + Firestore sync queue) */
  const saveLayout = () => {
    db.saveDashboardLayout(username, dashboardKey, config);
    setHasUnsaved(false);
  };

  /** Clears the saved layout and restores defaults */
  const resetToDefault = () => {
    const fresh = defaults.map((w, i) => ({ id: w.id, visible: w.visible, order: i }));
    setConfig(fresh);
    // Save defaults to DB so the reset is also persisted
    db.saveDashboardLayout(username, dashboardKey, fresh);
    setHasUnsaved(false);
  };

  return {
    config,
    orderedIds,
    isVisible,
    showCustomiser,
    setShowCustomiser,
    hasUnsaved,
    toggleVisible,
    moveUp,
    moveDown,
    saveLayout,
    resetToDefault,
  };
}
