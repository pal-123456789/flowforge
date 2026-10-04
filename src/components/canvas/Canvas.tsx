"use client";

import { useCallback, useRef, useState } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlowProvider,
  useReactFlow,
  type ReactFlowInstance,
  type NodeTypes,
} from "reactflow";
import FlowNode from "./FlowNode";
import { useEditorStore } from "@/store/editorStore";
import { recordRecentNode } from "./NodePalette";
import { QuickAdd, type QuickAddState } from "./QuickAdd";
import { CATEGORY_HEX, getNodeDef } from "@/lib/nodeRegistry";

const nodeTypes: NodeTypes = { flowNode: FlowNode };

function CanvasInner() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [instance, setInstance] = useState<ReactFlowInstance | null>(null);
  const [quickAdd, setQuickAdd] = useState<QuickAddState | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  const nodes = useEditorStore((s) => s.nodes);
  const edges = useEditorStore((s) => s.edges);
  const onNodesChange = useEditorStore((s) => s.onNodesChange);
  const onEdgesChange = useEditorStore((s) => s.onEdgesChange);
  const onConnect = useEditorStore((s) => s.onConnect);
  const addNodeOfType = useEditorStore((s) => s.addNodeOfType);
  const selectNode = useEditorStore((s) => s.selectNode);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/flowforge-node");
      if (!type) return;
      const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      recordRecentNode(type);
      addNodeOfType(type, position);
    },
    [screenToFlowPosition, addNodeOfType]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  // double-click an empty area of the pane → fuzzy quick-add menu
  const onPaneDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      const flow = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      setQuickAdd({ screen: { x: e.clientX, y: e.clientY }, flow });
    },
    [screenToFlowPosition]
  );

  const quickAddPick = useCallback(
    (type: string, flow: { x: number; y: number }) => {
      recordRecentNode(type);
      addNodeOfType(type, flow);
    },
    [addNodeOfType]
  );

  return (
    <div
      ref={wrapperRef}
      className="w-full h-full"
      onDoubleClick={(e) => {
        // only trigger when double-clicking empty pane (not nodes/edges/controls)
        const target = e.target as HTMLElement;
        if (
          target.classList.contains("react-flow__pane") ||
          target.classList.contains("react-flow__background")
        ) {
          onPaneDoubleClick(e);
        }
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges as any}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={(_, n) => selectNode(n.id)}
        onPaneClick={() => selectNode(null)}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.3, maxZoom: 1.2 }}
        minZoom={0.2}
        maxZoom={2}
        defaultEdgeOptions={{ animated: true, type: "smoothstep" }}
        proOptions={{ hideAttribution: true }}
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1.5}
          color="var(--c-dots)"
        />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => {
            const def = getNodeDef((n.data as any)?.type);
            return def ? CATEGORY_HEX[def.category] : "#6b7291";
          }}
          maskColor="rgba(10,11,18,0.75)"
          style={{ width: 160, height: 100 }}
        />
      </ReactFlow>
      <QuickAdd
        state={quickAdd}
        onPick={quickAddPick}
        onClose={() => setQuickAdd(null)}
      />
    </div>
  );
}

export function Canvas() {
  return (
    <ReactFlowProvider>
      <CanvasInner />
    </ReactFlowProvider>
  );
}
