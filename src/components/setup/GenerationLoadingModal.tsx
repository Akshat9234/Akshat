import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, Loader2, Cpu, AlertCircle, RefreshCw } from 'lucide-react';

interface GenerationLoadingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  dreamJob: string;
  hasError?: boolean;
  onRetry?: () => void;
  isReady?: boolean;
}

const GENERATION_STEPS = [
  'Analyzing your career goal...',
  'Checking existing skills...',
  'Mapping required skills...',
  'Designing projects...',
  'Calculating your timeline...',
  'Building your roadmap...'
];

export const GenerationLoadingModal: React.FC<GenerationLoadingModalProps> = ({
  isOpen,
  onComplete,
  dreamJob,
  hasError = false,
  onRetry,
  isReady = true
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [reachedFinalStep, setReachedFinalStep] = useState(false);
  const [showReadyMessage, setShowReadyMessage] = useState(false);

  useEffect(() => {
    if (!isOpen || hasError) {
      setCurrentStepIndex(0);
      setReachedFinalStep(false);
      setShowReadyMessage(false);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < GENERATION_STEPS.length - 1) {
          return prev + 1;
        } else {
          setReachedFinalStep(true);
          clearInterval(interval);
          return prev;
        }
      });
    }, 450);

    return () => clearInterval(interval);
  }, [isOpen, hasError]);

  // Keep latest onComplete callback in ref to prevent stale closures or timer resets
  const onCompleteRef = React.useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Synchronize completion when both animation steps and data ready
  useEffect(() => {
    if (reachedFinalStep && isReady && isOpen && !hasError) {
      setShowReadyMessage(true);
      const timer = setTimeout(() => {
        onCompleteRef.current();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [reachedFinalStep, isReady, isOpen, hasError]);

  // Safety fallback: if waiting longer than 7s and data is ready, complete immediately
  useEffect(() => {
    if (isOpen && isReady && !hasError) {
      const safetyTimer = setTimeout(() => {
        setShowReadyMessage(true);
        setTimeout(() => {
          onCompleteRef.current();
        }, 400);
      }, 2500);
      return () => clearTimeout(safetyTimer);
    }
  }, [isOpen, isReady, hasError]);

  if (!isOpen) return null;

  const progressPercent = Math.min(100, Math.round(((currentStepIndex + 1) / GENERATION_STEPS.length) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl bg-slate-950 border border-cyan-500/35 p-7 text-center shadow-[0_0_60px_rgba(6,182,212,0.3)] overflow-hidden">
        {/* Glow elements */}
        <div className="absolute -top-16 -left-16 w-44 h-44 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Central Icon */}
        <div className="relative mx-auto w-16 h-16 mb-5 flex items-center justify-center">
          {hasError ? (
            <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>
          ) : (
            <>
              <div className="absolute inset-0 rounded-2xl bg-cyan-500/20 animate-ping" />
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg border border-cyan-300/40">
                <Cpu className="w-8 h-8 text-white animate-pulse" />
              </div>
            </>
          )}
        </div>

        <h3 className="text-lg font-bold text-white mb-1">
          {hasError ? 'Roadmap generation failed.' : 'Reverse Engineering Career Path'}
        </h3>
        <p className="text-xs text-cyan-300 font-mono mb-5 truncate px-2">
          "{dreamJob || 'Full Stack Developer'}"
        </p>

        {hasError ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed bg-rose-950/20 p-3 rounded-xl border border-rose-500/20">
              AI synthesis encountered a temporary delay. You can retry synthesis or immediately load the verified curriculum roadmap.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onRetry}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                onClick={onComplete}
                className="py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Use Demo Roadmap</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Progress Bar */}
            <div className="w-full bg-slate-900 rounded-full h-2 mb-6 overflow-hidden border border-white/5">
              <div
                className="bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Ready Banner */}
            {showReadyMessage && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 flex items-center justify-center gap-2 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-pulse">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <span>Your personalized roadmap is ready.</span>
              </div>
            )}

            {/* Steps List */}
            <div className="space-y-2.5 text-left mb-4">
              {GENERATION_STEPS.map((step, idx) => {
                const isDone = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-2.5 rounded-xl text-xs transition-all duration-300 ${
                      isCurrent ? 'bg-cyan-950/40 border border-cyan-500/30 text-white font-semibold' :
                      isDone ? 'text-slate-400' : 'text-slate-600'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-cyan-400 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 flex-shrink-0" />
                    )}
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-mono">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>CareerQuest Graph Synthesizer</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
