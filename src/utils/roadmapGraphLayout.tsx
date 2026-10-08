import { Edge, Node } from '@xyflow/react';
import { RoadmapData, RoadmapNode } from '../types/roadmap';

export interface GraphLayoutResult {
  nodes: Node[];
  edges: Edge[];
}

export function buildRoadmapGraph(
  roadmap: RoadmapData,
  selectedNodeId: string | null,
  onSelectNode: (node: RoadmapNode) => void,
  onQuickKnown: (node: RoadmapNode) => void
): GraphLayoutResult {
  const flowNodes: Node[] = [];
  const flowEdges: Edge[] = [];
  const seenEdgeKeys = new Set<string>();

  const phases = (roadmap && Array.isArray(roadmap.phases)) ? roadmap.phases : [];
  let currentY = 100;
  const X_CENTER = 480;
  const X_GAP = 340;
  const Y_GAP = 200;

  let previousLevelNodeIds: string[] = [];

  // Hierarchy mapping categories as requested in Section 2:
  // CURRENT LEVEL ↓ FOUNDATIONS ↓ TECHNICAL SKILLS ↓ PROJECTS ↓ PORTFOLIO ↓ EXPERIENCE ↓ INTERVIEW ↓ DREAM CAREER
  const getHierarchyTag = (phaseIndex: number, phaseName: string) => {
    const lower = (phaseName || '').toLowerCase();
    if (phaseIndex === 0) return 'FOUNDATIONS';
    if (lower.includes('project') || lower.includes('capstone')) return 'PROJECTS';
    if (lower.includes('portfolio') || lower.includes('proof')) return 'PORTFOLIO';
    if (lower.includes('experience') || lower.includes('internship')) return 'EXPERIENCE';
    if (lower.includes('interview')) return 'INTERVIEW';
    if (phaseIndex === phases.length - 1) return 'DREAM CAREER';
    return 'TECHNICAL SKILLS';
  };

  phases.forEach((phase, phaseIndex) => {
    const nodesInPhase = (phase && Array.isArray(phase.nodes)) ? phase.nodes : [];
    const count = nodesInPhase.length;
    const hierarchyTag = getHierarchyTag(phaseIndex, phase?.name || '');
    const phaseMarkerId = `phase-marker-${phase?.id || phaseIndex}`;

    // Left sidebar phase indicator node
    flowNodes.push({
      id: phaseMarkerId,
      type: 'default',
      position: { x: 20, y: currentY + 10 },
      data: {
        label: (
          <div className="text-left font-mono select-none pointer-events-none p-1">
            <div className="text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              {hierarchyTag}
            </div>
            <div className="text-xs font-bold text-white mt-0.5 truncate max-w-[140px]">
              {(phase?.name || `Phase ${phaseIndex + 1}`).replace(/^PHASE \d+ · /, '')}
            </div>
            <div className="text-[10px] text-slate-400">{phase?.duration || ''}</div>
          </div>
        )
      },
      style: {
        background: 'rgba(15, 23, 42, 0.7)',
        borderColor: 'rgba(6, 182, 212, 0.25)',
        borderRadius: '12px',
        color: '#e2e8f0',
        width: 170,
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        backdropFilter: 'blur(10px)'
      },
      selectable: false,
      draggable: false
    });

    // Determine horizontal distribution of skills
    const levelNodeIds: string[] = [];

    nodesInPhase.forEach((node, nodeIdx) => {
      const nodeId = node?.id || `node-${phaseIndex}-${nodeIdx}`;
      let xPos = X_CENTER;
      if (count > 1) {
        const offset = (nodeIdx - (count - 1) / 2) * X_GAP;
        xPos = X_CENTER + offset;
      }

      flowNodes.push({
        id: nodeId,
        type: 'customRoadmap',
        position: { x: xPos - 150, y: currentY },
        data: {
          node,
          isSelected: selectedNodeId === nodeId,
          onSelectNode,
          onQuickKnown
        }
      });

      levelNodeIds.push(nodeId);
    });

    const safeAddEdge = (sourceId: string, targetId: string, targetStatus?: string) => {
      const key = `${sourceId}->${targetId}`;
      if (!seenEdgeKeys.has(key)) {
        seenEdgeKeys.add(key);
        flowEdges.push(createEdge(sourceId, targetId, targetStatus));
      }
    };

    // Connect from previous level
    if (previousLevelNodeIds.length > 0 && levelNodeIds.length > 0) {
      if (previousLevelNodeIds.length === 1 && levelNodeIds.length > 1) {
        // One parent branching out to multiple children
        const parentId = previousLevelNodeIds[0];
        levelNodeIds.forEach(childId => {
          const targetNode = nodesInPhase.find(n => n.id === childId);
          safeAddEdge(parentId, childId, targetNode?.status);
        });
      } else if (previousLevelNodeIds.length > 1 && levelNodeIds.length === 1) {
        // Multiple parallel branches converging into one (e.g. Frontend+Backend+DB -> Project)
        const childId = levelNodeIds[0];
        const targetNode = nodesInPhase[0];
        previousLevelNodeIds.forEach(parentId => {
          safeAddEdge(parentId, childId, targetNode?.status);
        });
      } else if (previousLevelNodeIds.length === levelNodeIds.length) {
        // 1:1 or N:N mapped lanes
        levelNodeIds.forEach((childId, idx) => {
          const parentId = previousLevelNodeIds[idx];
          const targetNode = nodesInPhase.find(n => n.id === childId);
          safeAddEdge(parentId, childId, targetNode?.status);
        });
      } else {
        const parentId = previousLevelNodeIds[0];
        levelNodeIds.forEach(childId => {
          const targetNode = nodesInPhase.find(n => n.id === childId);
          safeAddEdge(parentId, childId, targetNode?.status);
        });
      }
    }

    previousLevelNodeIds = levelNodeIds;
    currentY += Y_GAP + (count > 1 ? 20 : 0);
  });

  return { nodes: flowNodes, edges: flowEdges };
}

function createEdge(sourceId: string, targetId: string, targetStatus?: string): Edge {
  const isCompleted = targetStatus === 'completed';
  const isActive = targetStatus === 'active';
  const isRecommended = targetStatus === 'recommended';

  let strokeColor = '#334155';
  let strokeWidth = 2;
  let animated = false;

  if (isCompleted) {
    strokeColor = '#10b981';
    strokeWidth = 2.5;
  } else if (isActive) {
    strokeColor = '#06b6d4';
    strokeWidth = 2.5;
    animated = true;
  } else if (isRecommended) {
    strokeColor = '#f59e0b';
    strokeWidth = 2;
    animated = true;
  }

  return {
    id: `e-${sourceId}-${targetId}`,
    source: sourceId,
    target: targetId,
    type: 'smoothstep',
    animated,
    style: {
      stroke: strokeColor,
      strokeWidth,
      opacity: targetStatus === 'locked' ? 0.45 : 0.95,
      transition: 'stroke 0.4s ease, stroke-width 0.4s ease'
    }
  };
}
