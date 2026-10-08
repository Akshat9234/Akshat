import React, { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  Award, 
  Info,
  Check
} from 'lucide-react';
import { 
  CareerPreset, 
  CareerSetupInput, 
  Milestone, 
  RoadmapData, 
  RoadmapNode, 
  UserProfile 
} from './types/roadmap';
import { 
  INITIAL_DEMO_ROADMAP, 
  INITIAL_MILESTONES 
} from './data/demoRoadmaps';
import { requestRoadmapGeneration, validateAndSanitizeRoadmap } from './services/aiService';

import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardView } from './components/views/DashboardView';
import { RoadmapCanvas } from './components/roadmap/RoadmapCanvas';
import { NodeDetailDrawer } from './components/roadmap/NodeDetailDrawer';
import { ReplanningModal } from './components/roadmap/ReplanningModal';
import { RoadmapHeaderDashboard } from './components/roadmap/RoadmapHeaderDashboard';
import { CareerPathsView } from './components/views/CareerPathsView';
import { ProgressView } from './components/views/ProgressView';
import { CoachView } from './components/views/CoachView';
import { CareerSetupModal } from './components/setup/CareerSetupModal';
import { GenerationLoadingModal } from './components/setup/GenerationLoadingModal';
import { ExportRoadmapModal } from './components/export/ExportRoadmapModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [roadmap, setRoadmap] = useState<RoadmapData>(INITIAL_DEMO_ROADMAP);
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  
  // Modals state
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingDreamJob, setGeneratingDreamJob] = useState('');
  const [generationError, setGenerationError] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [pendingRoadmap, setPendingRoadmap] = useState<RoadmapData | null>(null);
  const newlyGeneratedRoadmapRef = React.useRef<RoadmapData | null>(null);
  const lastSetupInputRef = React.useRef<CareerSetupInput | null>(null);
  const [replanningNode, setReplanningNode] = useState<RoadmapNode | null>(null);
  const [isReplanningOpen, setIsReplanningOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Demo step tracking (1 - 9)
  const [currentDemoStep, setCurrentDemoStep] = useState(1);

  // Coach pre-fill
  const [coachQuestion, setCoachQuestion] = useState<string | null>(null);

  // Toast banner state
  const [toast, setToast] = useState<{ message: string; detail?: string; type: 'success' | 'ai' | 'xp' | 'info' } | null>(null);

  // Gamification & User State
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Alex Mercer',
    role: 'Computer Science Student',
    levelTitle: 'Career Builder',
    levelNumber: 4,
    currentXp: 820,
    nextLevelXp: 1000,
    studentMode: true,
    streakDays: 5
  });

  const [milestones, setMilestones] = useState<Milestone[]>(INITIAL_MILESTONES);

  const showToast = useCallback((message: string, detail?: string, type: 'success' | 'ai' | 'xp' | 'info' = 'success') => {
    setToast({ message, detail, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  }, []);

  const addXp = useCallback((amount: number) => {
    setUserProfile(prev => {
      const newXp = prev.currentXp + amount;
      if (newXp >= prev.nextLevelXp) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        return {
          ...prev,
          levelNumber: prev.levelNumber + 1,
          currentXp: newXp - prev.nextLevelXp,
          nextLevelXp: Math.round(prev.nextLevelXp * 1.3),
          levelTitle: prev.levelNumber === 4 ? 'Full-Stack Architect' : 'Staff Engineer'
        };
      }
      return { ...prev, currentXp: newXp };
    });
  }, []);

  // Handlers for New Roadmap & New Career Quest (Requirements 3, 4, 5)
  const handleStartSetup = useCallback(() => {
    setSelectedNode(null);
    setIsSetupOpen(true);
  }, []);

  const handleNewCareerQuest = useCallback(() => {
    setSelectedNode(null);
    setPendingRoadmap(null);
    newlyGeneratedRoadmapRef.current = null;
    setIsSetupOpen(true);
  }, []);

  // Handler for generating new roadmap from setup wizard
  const handleStartGeneration = useCallback(async (input: CareerSetupInput) => {
    lastSetupInputRef.current = input;
    newlyGeneratedRoadmapRef.current = null;
    setSelectedNode(null);
    setIsSetupOpen(false);
    setGeneratingDreamJob(input.dreamJob || 'Full Stack Developer');
    setGenerationError(false);
    setIsDataReady(false);
    setPendingRoadmap(null);
    setIsGenerating(true);

    try {
      const newRoadmap = await requestRoadmapGeneration(input);
      const sanitized = validateAndSanitizeRoadmap(newRoadmap, input.dreamJob);
      newlyGeneratedRoadmapRef.current = sanitized;
      setPendingRoadmap(sanitized);
      setIsDataReady(true);
    } catch (err) {
      console.error('Roadmap generation failed:', err);
      const fallback = validateAndSanitizeRoadmap(INITIAL_DEMO_ROADMAP, input.dreamJob);
      newlyGeneratedRoadmapRef.current = fallback;
      setPendingRoadmap(fallback);
      setGenerationError(true);
    }
  }, []);

  // Handler for 1-Click Demo (Requirement 3 Ideathon Demo Flow)
  const handleTryDemo = useCallback(() => {
    handleStartGeneration({
      dreamJob: 'Full Stack Developer at a Climate-Tech Startup',
      industry: 'Climate Tech',
      level: 'College Student',
      existingSkills: ['C', 'HTML'],
      hoursPerWeek: 10,
      timeline: '6 months',
      targetCompany: 'Climate Startup'
    });
  }, [handleStartGeneration]);

  const handleGenerationComplete = useCallback(() => {
    const raw = newlyGeneratedRoadmapRef.current || pendingRoadmap || roadmap;
    const finalRoadmap = validateAndSanitizeRoadmap(raw);
    setRoadmap(finalRoadmap);
    setSelectedNode(null);
    setIsGenerating(false);
    setActiveTab('roadmap');
    setCurrentDemoStep(3);
    try {
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
    } catch (e) {
      // Confetti fallback
    }
    addXp(150);
    showToast(
      'Roadmap Created by AI!',
      `Personalized skill tree generated for ${finalRoadmap.career}`,
      'ai'
    );
  }, [pendingRoadmap, roadmap, addXp, showToast]);

  // Handler when clicking "I Already Know This" on a node (Section 5)
  const handleTriggerReplanning = useCallback((node: RoadmapNode) => {
    setSelectedNode(null);
    setReplanningNode(node);
    setIsReplanningOpen(true);
  }, []);

  // Confirming the Dynamic Replanning (Section 5 Exact Notification Requirement)
  const handleConfirmReplanning = useCallback((node: RoadmapNode, weeksSaved: number) => {
    setIsReplanningOpen(false);

    // Update node status and recalculate roadmap
    setRoadmap(prev => {
      const prevWeeks = prev.estimatedWeeks || 24;
      const updatedWeeks = Math.max(2, prevWeeks - weeksSaved);

      const updatedPhases = prev.phases.map(phase => {
        const updatedNodes = phase.nodes.map(n => {
          if (n.id === node.id) {
            return {
              ...n,
              status: 'completed' as const,
              isKnownSkill: true
            };
          }
          // If node was locked, advance the next logical node to active
          if (n.status === 'locked' && phase.nodes.some(p => p.id === node.id)) {
            return { ...n, status: 'active' as const };
          }
          return n;
        });
        return { ...phase, nodes: updatedNodes };
      });

      return {
        ...prev,
        estimatedWeeks: updatedWeeks,
        phases: updatedPhases
      };
    });

    // Award XP and celebratory confetti
    addXp(100);
    try {
      confetti({
        particleCount: 80,
        spread: 75,
        origin: { y: 0.5 },
        colors: ['#06b6d4', '#3b82f6', '#10b981']
      });
    } catch (e) {
      // safe fallback
    }

    // Mark milestone if not already completed
    setMilestones(prev => prev.map(m => m.id === 'm5' ? { ...m, completed: true, unlockedAt: 'Just now' } : m));

    // Requirement 6 Ideathon WOW Moment notification:
    showToast(
      '✓ Roadmap optimized',
      `${node.title} marked as known. Dependent skills unlocked. Your estimated timeline has been updated (${weeksSaved} weeks saved).`,
      'ai'
    );
    setCurrentDemoStep(8);
  }, [addXp, showToast]);

  // Handler for marking a node complete (Requirement 11 Milestone Celebrations)
  const handleMarkComplete = useCallback((nodeId: string) => {
    setRoadmap(prev => {
      let nodeTitle = '';
      let isImportantMilestone = false;
      const updatedPhases = (prev.phases || []).map(phase => {
        const updatedNodes = (phase.nodes || []).map(n => {
          if (n.id === nodeId) {
            nodeTitle = n.title;
            if (n.type === 'project' || n.type === 'milestone' || n.type === 'portfolio') {
              isImportantMilestone = true;
            }
            return { ...n, status: 'completed' as const };
          }
          return n;
        });
        return { ...phase, nodes: updatedNodes };
      });

      const awardedXp = isImportantMilestone ? 100 : 75;
      addXp(awardedXp);
      try {
        confetti({ particleCount: isImportantMilestone ? 55 : 35, spread: 50, origin: { y: 0.65 } });
      } catch (e) {
        // safe fallback
      }

      if (isImportantMilestone) {
        showToast('Milestone unlocked!', `${nodeTitle} (+100 XP)`, 'xp');
      } else {
        showToast('Skill Mastered! +75 XP', `Completed: ${nodeTitle || 'Milestone'}`, 'xp');
      }

      return { ...prev, phases: updatedPhases };
    });

    setSelectedNode(null);
  }, [addXp, showToast]);

  // Handler for changing hours per week (Section 6)
  const handleChangeHours = useCallback((newHours: number) => {
    setRoadmap(prev => {
      const newWeeks = Math.ceil((prev.totalEstimatedHours || 240) / newHours);
      return {
        ...prev,
        hoursPerWeek: newHours,
        estimatedWeeks: newWeeks
      };
    });
  }, []);

  // Quick Demo Step Walkthrough Handler (Section 12)
  const handleTriggerQuickDemoStep = useCallback((stepNumber: number) => {
    const allNodes = (roadmap.phases || []).flatMap(p => p.nodes || []);
    const reactNode = allNodes.find(n => n.title.toLowerCase().includes('react')) || allNodes[2] || allNodes[0];

    if (stepNumber === 4) {
      if (reactNode) {
        setSelectedNode(reactNode);
        setCurrentDemoStep(4);
        showToast('Demo Step 4: Opened React Mission', 'AI Weekend Mission and interview challenge loaded.', 'info');
      }
    } else if (stepNumber === 6) {
      if (reactNode) {
        setSelectedNode(null);
        setReplanningNode(reactNode);
        setIsReplanningOpen(true);
        setCurrentDemoStep(6);
      }
    } else if (stepNumber === 8) {
      handleChangeHours(15);
      setCurrentDemoStep(8);
      showToast('Demo Step 8: Accelerated Pace', 'Learning schedule changed from 10 → 15 hrs/week. Roadmap duration reduced!', 'ai');
    }
  }, [roadmap, handleChangeHours, showToast]);

  // Load a career preset directly (Section 13)
  const handleSelectCareerPreset = useCallback((preset: CareerPreset) => {
    handleStartGeneration({
      dreamJob: preset.title,
      industry: preset.industry,
      level: userProfile.studentMode ? 'College Student' : 'Intermediate',
      existingSkills: ['Git', 'JavaScript'],
      hoursPerWeek: roadmap.hoursPerWeek || 10,
      timeline: preset.typicalTimeline,
      targetCompany: 'Product Company'
    });
  }, [handleStartGeneration, userProfile.studentMode, roadmap.hoursPerWeek]);

  // Ask AI coach from node details (Section 4 & 10)
  const handleAskCoach = useCallback((question: string) => {
    setCoachQuestion(question);
    setActiveTab('coach');
  }, []);

  // Study hours logging from progress view (Section 8)
  const handleLogStudyHours = useCallback((hours: number) => {
    addXp(hours * 20);
    confetti({ particleCount: 30, spread: 45, origin: { y: 0.7 } });
    showToast(`Logged ${hours}h Study Time!`, `+${hours * 20} XP gained towards next level`, 'xp');
  }, [addXp, showToast]);

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-black">
      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        userProfile={userProfile}
        onToggleStudentMode={() => {
          setUserProfile(prev => ({ ...prev, studentMode: !prev.studentMode }));
          showToast(
            userProfile.studentMode ? 'Pro Engineer Mode Active' : 'Student Mode Active',
            userProfile.studentMode ? 'Emphasizing industry systems & architecture' : 'Emphasizing internships & foundations',
            'info'
          );
        }}
        onStartSetup={handleNewCareerQuest}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Pane */}
      <div className="md:pl-64 flex-1 flex flex-col min-w-0">
        <Navbar
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onStartSetup={handleStartSetup}
          onOpenExport={() => setIsExportOpen(true)}
          onTryDemo={handleTryDemo}
          activeTab={activeTab}
          roadmap={roadmap}
        />

        {/* Global Toast Notification */}
        {toast && (
          <div className="fixed top-20 right-4 sm:right-8 z-50 animate-bounce-subtle pointer-events-auto">
            <div className={`p-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3.5 max-w-md ${
              toast.type === 'ai' ? 'bg-cyan-950/95 border-cyan-400 text-white shadow-[0_0_30px_rgba(6,182,212,0.35)]' :
              toast.type === 'xp' ? 'bg-amber-950/95 border-amber-400 text-white shadow-[0_0_30px_rgba(245,158,11,0.35)]' :
              'bg-slate-900/95 border-emerald-400 text-white shadow-[0_0_30px_rgba(16,185,129,0.35)]'
            }`}>
              <div className="p-2 rounded-xl bg-white/10 flex-shrink-0">
                {toast.type === 'ai' ? <Sparkles className="w-5 h-5 text-cyan-300" /> :
                 toast.type === 'xp' ? <Award className="w-5 h-5 text-amber-300" /> :
                 <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold leading-tight">{toast.message}</div>
                {toast.detail && (
                  <div className="text-[11px] text-slate-300 leading-snug mt-0.5">{toast.detail}</div>
                )}
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {/* TAB 1: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <DashboardView
              onStartSetup={handleStartSetup}
              onExploreCareers={() => setActiveTab('career-paths')}
              onViewActiveRoadmap={() => setActiveTab('roadmap')}
              onTryDemo={handleTryDemo}
              currentRoadmap={roadmap}
            />
          )}

          {/* TAB 2: MY ROADMAP (HERO FEATURE: INTERACTIVE SKILL TREE) */}
          {activeTab === 'roadmap' && (
            <div className="space-y-4">
              {/* Top 5 Dashboard Summary Cards & Hours Adjustment */}
              <RoadmapHeaderDashboard
                roadmap={roadmap}
                onChangeHours={handleChangeHours}
                onTriggerQuickDemoStep={handleTriggerQuickDemoStep}
                currentDemoStep={currentDemoStep}
                onSelectSkill={(node) => setSelectedNode(node)}
              />

              {/* The Interactive Node Graph Canvas */}
              <RoadmapCanvas
                roadmap={roadmap}
                selectedNode={selectedNode}
                onSelectNode={(node) => setSelectedNode(node)}
                onQuickKnown={(node) => handleTriggerReplanning(node)}
                onStartSetup={handleStartSetup}
              />
            </div>
          )}

          {/* TAB 3: CAREER PATHS */}
          {activeTab === 'career-paths' && (
            <CareerPathsView
              onSelectCareerPreset={handleSelectCareerPreset}
            />
          )}

          {/* TAB 4: PROGRESS */}
          {activeTab === 'progress' && (
            <ProgressView
              roadmap={roadmap}
              userProfile={userProfile}
              milestones={milestones}
              onLogStudyHours={handleLogStudyHours}
            />
          )}

          {/* TAB 5: AI CAREER COACH */}
          {activeTab === 'coach' && (
            <CoachView
              roadmap={roadmap}
              initialQuestion={coachQuestion}
              onClearInitialQuestion={() => setCoachQuestion(null)}
            />
          )}
        </main>
      </div>

      {/* Node Detail Slide-Over Drawer (AI Mission Panel) */}
      <NodeDetailDrawer
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onMarkComplete={handleMarkComplete}
        onTriggerReplanning={handleTriggerReplanning}
        onAskCoach={handleAskCoach}
        career={roadmap.career}
        industry={roadmap.industry}
      />

      {/* Dynamic Replanning Modal */}
      <ReplanningModal
        node={replanningNode}
        roadmap={roadmap}
        isOpen={isReplanningOpen}
        onClose={() => setIsReplanningOpen(false)}
        onConfirmReplanning={handleConfirmReplanning}
      />

      {/* Career Setup Wizard Modal */}
      <CareerSetupModal
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        onSubmit={handleStartGeneration}
      />

      {/* AI Roadmap Generation Loading Modal */}
      <GenerationLoadingModal
        isOpen={isGenerating}
        onComplete={handleGenerationComplete}
        dreamJob={generatingDreamJob}
        hasError={generationError}
        isReady={isDataReady}
        onRetry={() => {
          if (lastSetupInputRef.current) {
            handleStartGeneration(lastSetupInputRef.current);
          } else {
            handleTryDemo();
          }
        }}
      />

      {/* Export / Share Modal */}
      <ExportRoadmapModal
        roadmap={roadmap}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
