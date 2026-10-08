import React, { useMemo, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  Panel
} from '@xyflow/react';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Filter, 
  Search, 
  Sparkles, 
  Clock, 
  Layers,
  CheckCircle2,
  Lock,
  Flame
} from 'lucide-react';
import { RoadmapData, RoadmapNode } from '../../types/roadmap';
import { CustomRoadmapNode } from './CustomRoadmapNode';
import { buildRoadmapGraph } from '../../utils/roadmapGraphLayout';

interface RoadmapCanvasProps {
  roadmap: RoadmapData;
  selectedNode: RoadmapNode | null;
  onSelectNode: (node: RoadmapNode) => void;
  onQuickKnown: (node: RoadmapNode) => void;
  onStartSetup?: () => void;
}

const nodeTypes = {
  customRoadmap: CustomRoadmapNode
};

export const RoadmapCanvas: React.FC<RoadmapCanvasProps> = ({
  roadmap,
  selectedNode,
  onSelectNode,
  onQuickKnown,
  onStartSetup
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!roadmap || !roadmap.phases || roadmap.phases.length === 0) {
      return { initialNodes: [], initialEdges: [] };
    }
    const { nodes, edges } = buildRoadmapGraph(
      roadmap,
      selectedNode ? selectedNode.id : null,
      onSelectNode,
      onQuickKnown
    );
    return { initialNodes: nodes, initialEdges: edges };
  }, [roadmap, selectedNode, onSelectNode, onQuickKnown]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync graph whenever roadmap data or selection changes
  useEffect(() => {
    if (!roadmap || !roadmap.phases || roadmap.phases.length === 0) return;
    const { nodes: newNodes, edges: newEdges } = buildRoadmapGraph(
      roadmap,
      selectedNode ? selectedNode.id : null,
      onSelectNode,
      onQuickKnown
    );

    // Apply client filter or search query if set
    let filteredNodes = newNodes;
    if (filterType !== 'all') {
      filteredNodes = filteredNodes.map(n => ({
        ...n,
        hidden: (n.data?.node as RoadmapNode)?.type !== filterType
      }));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredNodes = filteredNodes.map(n => {
        const nodeData = n.data?.node as RoadmapNode;
        const matches = nodeData?.title.toLowerCase().includes(q) || nodeData?.description.toLowerCase().includes(q);
        return {
          ...n,
          hidden: n.hidden || !matches
        };
      });
    }

    setNodes(filteredNodes);
    setEdges(newEdges);
  }, [roadmap, selectedNode, filterType, searchQuery, setNodes, setEdges, onSelectNode, onQuickKnown]);

  // Requirement 6 & 12: Safe Empty State
  if (!roadmap || !roadmap.phases || roadmap.phases.length === 0) {
    return (
      <div className="relative w-full h-[600px] flex items-center justify-center bg-[#07090E] rounded-2xl border border-white/5 p-8 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mx-auto">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white">No roadmap created yet.</h2>
          <p className="text-sm text-slate-400">
            Tell us your dream job and we'll build your path.
          </p>
          {onStartSetup && (
            <button
              onClick={onStartSetup}
              className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm inline-flex items-center gap-2 cursor-pointer transition-all shadow-lg"
            >
              <span>Build My Roadmap</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Aggregate stats
  const allNodesList = useMemo(() => {
    return (roadmap.phases || []).flatMap(p => p.nodes || []);
  }, [roadmap]);

  const completedCount = allNodesList.filter(n => n.status === 'completed').length;
  const activeCount = allNodesList.filter(n => n.status === 'active').length;
  const progressPercent = allNodesList.length > 0 
    ? Math.round((completedCount / allNodesList.length) * 100) 
    : 0;

  return (
    <div className="relative w-full h-full min-h-[700px] flex-1 bg-[#07090E] overflow-hidden rounded-2xl border border-white/5">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Search & Filter pill cluster */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xl">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search skills, tools, projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950/80 border border-white/5 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48 transition-all"
            />
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block" />

          {/* Filter Type Pills */}
          <div className="flex items-center gap-1 overflow-x-auto text-xs">
            {[
              { id: 'all', label: 'All Nodes' },
              { id: 'skill', label: 'Skills' },
              { id: 'project', label: 'Projects' },
              { id: 'interview', label: 'Interview' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterType === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Progress Quick Pill */}
        <div className="flex items-center gap-3 pointer-events-auto bg-slate-900/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 shadow-xl text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono font-bold text-[11px] text-cyan-300">
              {progressPercent}%
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium">Roadmap Progress</div>
              <div className="text-xs font-semibold text-white">
                {completedCount} of {allNodesList.length} Milestones
              </div>
            </div>
          </div>

          <div className="h-5 w-[1px] bg-white/10" />

          <div className="flex items-center gap-1.5 text-slate-300">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-white">{roadmap.estimatedWeeks} wks</span>
            <span className="text-slate-400">@ {roadmap.hoursPerWeek}h/wk</span>
          </div>
        </div>
      </div>

      {/* Main React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="rgba(255, 255, 255, 0.07)"
        />
        <Controls
          showInteractive={false}
          className="!bottom-4 !left-4"
        />
        <MiniMap
          nodeColor={(n) => {
            const nodeData = n.data?.node as RoadmapNode;
            if (nodeData?.status === 'completed') return '#10b981';
            if (nodeData?.status === 'active') return '#06b6d4';
            if (nodeData?.status === 'recommended') return '#f59e0b';
            return '#1e293b';
          }}
          maskColor="rgba(7, 9, 14, 0.85)"
          className="!bottom-4 !right-4 !rounded-xl !overflow-hidden !border !border-white/10 !bg-slate-950/80 !shadow-2xl"
          zoomable
          pannable
        />

        {/* Legend Panel at Bottom Center */}
        <Panel position="bottom-center" className="mb-2">
          <div className="flex flex-wrap items-center gap-3 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/10 shadow-lg text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-slate-300">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.5)] animate-pulse" />
              <span className="text-slate-300">Active</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <span className="text-slate-300">Recommended</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700" />
              <span className="text-slate-400">Locked</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
};
