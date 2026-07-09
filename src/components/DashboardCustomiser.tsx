import React from 'react';
import {
  X, Eye, EyeOff, ChevronUp, ChevronDown,
  RotateCcw, Save, Layout, GripVertical, CheckCircle2
} from 'lucide-react';
import type { WidgetConfig } from '../hooks/useDashboardLayout';

export interface WidgetDef {
  id: string;
  label: string;
  description?: string;
}

interface DashboardCustomiserProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  widgets: WidgetDef[];
  config: WidgetConfig[];
  hasUnsaved: boolean;
  onToggleVisible: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onSave: () => void;
  onReset: () => void;
}

export const DashboardCustomiser: React.FC<DashboardCustomiserProps> = ({
  isOpen, onClose, title = 'Customise Dashboard',
  widgets, config, hasUnsaved,
  onToggleVisible, onMoveUp, onMoveDown, onSave, onReset,
}) => {
  if (!isOpen) return null;

  const sortedConfig = [...config].sort((a, b) => a.order - b.order);
  const visibleCount = sortedConfig.filter(c => c.visible).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px] z-40 transition-all"
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div
        className="fixed right-0 top-0 h-full w-[320px] bg-white dark:bg-dark-surface border-l border-slate-200 dark:border-dark-border shadow-2xl z-50 flex flex-col"
        style={{ animation: 'slideInFromRight 0.22s cubic-bezier(0.25,0.46,0.45,0.94) both' }}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-dark-border bg-gradient-to-br from-primary/8 to-secondary/5">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                <Layout size={16} className="text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">{title}</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {visibleCount} of {sortedConfig.length} widgets visible
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-all"
            >
              <X size={15} />
            </button>
          </div>

          {hasUnsaved && (
            <div className="mt-3 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              Unsaved changes
            </div>
          )}
        </div>

        {/* Instruction hint */}
        <div className="px-4 pt-3 pb-1">
          <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
            Use the arrows to reorder, and the eye icon to show/hide each widget.
          </p>
        </div>

        {/* Widget List */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5 mt-2">
          {sortedConfig.map((cfg, idx) => {
            const widget = widgets.find(w => w.id === cfg.id);
            if (!widget) return null;

            return (
              <div
                key={cfg.id}
                className={`group rounded-xl border transition-all duration-200 ${
                  cfg.visible
                    ? 'bg-white dark:bg-dark-card border-slate-200 dark:border-dark-border shadow-sm hover:border-primary/30 hover:shadow-md'
                    : 'bg-slate-50 dark:bg-dark-card/30 border-slate-100 dark:border-dark-border/30'
                }`}
              >
                <div className="flex items-center gap-2 p-3">
                  {/* Drag handle visual */}
                  <GripVertical
                    size={14}
                    className="text-slate-200 dark:text-slate-700 group-hover:text-slate-400 transition-colors shrink-0"
                  />

                  {/* Widget info */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-bold truncate transition-colors ${
                      cfg.visible
                        ? 'text-slate-800 dark:text-slate-100'
                        : 'text-slate-400 line-through'
                    }`}>
                      {widget.label}
                    </p>
                    {widget.description && (
                      <p className="text-[9px] text-slate-400 mt-0.5 truncate">{widget.description}</p>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => onMoveUp(cfg.id)}
                      disabled={idx === 0}
                      title="Move up"
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-300 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronUp size={13} />
                    </button>
                    <button
                      onClick={() => onMoveDown(cfg.id)}
                      disabled={idx === sortedConfig.length - 1}
                      title="Move down"
                      className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-300 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronDown size={13} />
                    </button>
                    <button
                      onClick={() => onToggleVisible(cfg.id)}
                      title={cfg.visible ? 'Hide widget' : 'Show widget'}
                      className={`p-1 rounded-md transition-all ${
                        cfg.visible
                          ? 'text-primary hover:bg-primary/10'
                          : 'text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600'
                      }`}
                    >
                      {cfg.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-dark-border space-y-2 bg-slate-50/50 dark:bg-dark-card/20">
          <button
            onClick={() => { onSave(); onClose(); }}
            className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all ${
              hasUnsaved
                ? 'bg-primary hover:bg-primary-dark text-white shadow-primary/20'
                : 'bg-secondary/90 hover:bg-secondary text-white shadow-secondary/20'
            }`}
          >
            {hasUnsaved ? <Save size={14} /> : <CheckCircle2 size={14} />}
            {hasUnsaved ? 'Save Layout' : 'Layout Saved ✓'}
          </button>
          <button
            onClick={onReset}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
          >
            <RotateCcw size={12} />
            Reset to Default
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideInFromRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};
