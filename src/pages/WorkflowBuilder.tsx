import React, { useState, useCallback, useRef, DragEvent, ChangeEvent } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  Connection,
  Edge,
  Node,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  ReactFlowInstance,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
import {
  Save,
  Play,
  ArrowLeft,
  MessageSquare,
  Image,
  List,
  GitBranch,
  Clock,
  Trash2,
  Plus,
  Zap,
  AlignLeft,
  LayoutGrid,
  UserCheck,
  ChevronRight,
  X,
  Upload,
  FileVideo,
  FileText,
  Loader2,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useEffect } from "react";

// ─── Block definitions (left sidebar) ────────────────────────────────────────

const CONTENT_BLOCKS = [
  {
    type: "text_buttons",
    label: "Text + Buttons",
    icon: MessageSquare,
    color: "#25D366",
    bg: "#E8FFF1",
    description: "Send a message with reply buttons",
  },
  {
    type: "media",
    label: "Media",
    icon: Image,
    color: "#0084FF",
    bg: "#E8F4FF",
    description: "Image, video or document",
  },
  {
    type: "list",
    label: "List",
    icon: List,
    color: "#7C3AED",
    bg: "#F3EEFF",
    description: "List of selectable items",
  },
  {
    type: "condition",
    label: "Condition",
    icon: GitBranch,
    color: "#F59E0B",
    bg: "#FFFBEB",
    description: "Branch by tag, reply or field",
  },
  {
    type: "wait",
    label: "Delay",
    icon: Clock,
    color: "#EF4444",
    bg: "#FFF1F1",
    description: "Wait before the next step",
  },
  {
    type: "template",
    label: "Template",
    icon: LayoutGrid,
    color: "#0EA5E9",
    bg: "#E0F2FE",
    description: "Send an approved Meta template",
  },
  {
    type: "agent",
    label: "Request Intervention",
    icon: UserCheck,
    color: "#64748B",
    bg: "#F1F5F9",
    description: "Hand off to a human agent",
  },
];

// ─── Node renderers ───────────────────────────────────────────────────────────

const waBubble = "bg-white border border-gray-200 rounded-2xl shadow-sm text-[11px] text-gray-700 p-2 leading-relaxed";

const TriggerNode = ({ data }: any) => (
  <div className="w-52 rounded-2xl border-2 border-[#25D366] bg-white shadow-md overflow-hidden">
    <div className="bg-[#25D366] px-3 py-2 flex items-center gap-2">
      <Zap size={13} className="text-white" />
      <span className="text-white text-[11px] font-semibold">Trigger</span>
    </div>
    <div className="px-3 py-2">
      <p className="text-[11px] font-medium text-gray-800">{data.label || "Meta Lead Captured"}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">Starts when a new lead arrives</p>
    </div>
    <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[#25D366] !border-2 !border-white" />
  </div>
);

const TextButtonsNode = ({ data, selected }: any) => (
  <div className={`w-52 rounded-2xl bg-white shadow-md border-2 overflow-hidden transition-all ${selected ? "border-[#25D366]" : "border-gray-200"}`}>
    <div className="bg-gray-50 px-3 py-1.5 flex items-center gap-2 border-b border-gray-100">
      <MessageSquare size={11} className="text-[#25D366]" />
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Message</span>
    </div>
    <div className="px-3 py-2 space-y-1.5">
      <div className={waBubble}>
        <p>{data.message || "Please select an option to continue..."}</p>
      </div>
      {(data.buttons || ["View All Products", "Hot Deals!"]).map((btn: string, i: number) => (
        <div key={i} className="border border-[#25D366] text-[#25D366] rounded-xl text-[10px] text-center py-1 px-2 cursor-pointer hover:bg-[#E8FFF1] transition-colors">
          {btn}
        </div>
      ))}
      <div className="border border-dashed border-gray-300 text-gray-400 rounded-xl text-[10px] text-center py-1">
        + Add Button
      </div>
    </div>
    <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#25D366] !border-2 !border-white" />
    <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[#25D366] !border-2 !border-white" />
  </div>
);

const MediaNode = ({ data, selected }: any) => (
  <div className={`w-52 rounded-2xl bg-white shadow-md border-2 overflow-hidden transition-all ${selected ? "border-[#0084FF]" : "border-gray-200"}`}>
    <div className="bg-gray-50 px-3 py-1.5 flex items-center gap-2 border-b border-gray-100">
      <Image size={11} className="text-[#0084FF]" />
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Media</span>
    </div>
    <div className="px-3 py-2">
      {data.mediaUrl ? (
        data.mediaType === "image" ? (
          <img src={data.mediaUrl} alt="preview" className="w-full h-20 object-cover rounded-xl mb-1.5" />
        ) : data.mediaType === "video" ? (
          <video src={data.mediaUrl} className="w-full h-20 object-cover rounded-xl mb-1.5" />
        ) : (
          <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-2 mb-1.5">
            <FileText size={16} className="text-[#0084FF]" />
            <span className="text-[10px] text-gray-600 truncate">{data.mediaName}</span>
          </div>
        )
      ) : (
        <div className="bg-blue-50 border border-blue-100 rounded-xl h-20 flex items-center justify-center mb-1.5">
          <Upload size={20} className="text-blue-300" />
        </div>
      )}
      {data.caption && <p className="text-[10px] text-gray-500">{data.caption}</p>}
    </div>
    <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#0084FF] !border-2 !border-white" />
    <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[#0084FF] !border-2 !border-white" />
  </div>
);


const ListNode = ({ data, selected }: any) => (
  <div className={`w-52 rounded-2xl bg-white shadow-md border-2 overflow-hidden transition-all ${selected ? "border-[#7C3AED]" : "border-gray-200"}`}>
    <div className="bg-gray-50 px-3 py-1.5 flex items-center gap-2 border-b border-gray-100">
      <List size={11} className="text-[#7C3AED]" />
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">List</span>
    </div>
    <div className="px-3 py-2 space-y-1">
      <div className={waBubble}>{data.message || "Choose an option below"}</div>
      {(data.items || ["Option 1", "Option 2", "Option 3"]).map((item: string, i: number) => (
        <div key={i} className="flex items-center gap-2 text-[10px] text-gray-600 py-0.5 border-b border-gray-50">
          <ChevronRight size={10} className="text-[#7C3AED]" /> {item}
        </div>
      ))}
    </div>
    <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#7C3AED] !border-2 !border-white" />
    <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[#7C3AED] !border-2 !border-white" />
  </div>
);

const ConditionNode = ({ data, selected }: any) => (
  <div className={`w-52 rounded-2xl bg-white shadow-md border-2 overflow-hidden transition-all ${selected ? "border-[#F59E0B]" : "border-gray-200"}`}>
    <div className="bg-gray-50 px-3 py-1.5 flex items-center gap-2 border-b border-gray-100">
      <GitBranch size={11} className="text-[#F59E0B]" />
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Condition</span>
    </div>
    <div className="px-3 py-2">
      <p className="text-[11px] font-medium text-gray-700">If: {data.condition || "Has Tag: Joined"}</p>
      <div className="mt-2 flex justify-between text-[9px] font-bold">
        <span className="text-green-600 bg-green-50 px-2 py-0.5 rounded-full">✓ YES</span>
        <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded-full">✗ NO</span>
      </div>
    </div>
    <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#F59E0B] !border-2 !border-white" />
    <Handle type="source" position={Position.Bottom} id="yes" style={{ left: "25%" }} className="!w-3 !h-3 !bg-green-500 !border-2 !border-white" />
    <Handle type="source" position={Position.Bottom} id="no" style={{ left: "75%" }} className="!w-3 !h-3 !bg-red-400 !border-2 !border-white" />
  </div>
);

const WaitNode = ({ data, selected }: any) => (
  <div className={`w-52 rounded-2xl bg-white shadow-md border-2 overflow-hidden transition-all ${selected ? "border-[#EF4444]" : "border-gray-200"}`}>
    <div className="bg-gray-50 px-3 py-1.5 flex items-center gap-2 border-b border-gray-100">
      <Clock size={11} className="text-[#EF4444]" />
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Delay</span>
    </div>
    <div className="px-3 py-2 flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
        <Clock size={16} className="text-[#EF4444]" />
      </div>
      <div>
        <p className="text-[11px] font-medium text-gray-700">Wait {data.hours || 2} hours</p>
        <p className="text-[10px] text-gray-400">before next step</p>
      </div>
    </div>
    <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#EF4444] !border-2 !border-white" />
    <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[#EF4444] !border-2 !border-white" />
  </div>
);

const TemplateNode = ({ data, selected }: any) => (
  <div className={`w-52 rounded-2xl bg-white shadow-md border-2 overflow-hidden transition-all ${selected ? "border-[#0EA5E9]" : "border-gray-200"}`}>
    <div className="bg-gray-50 px-3 py-1.5 flex items-center gap-2 border-b border-gray-100">
      <LayoutGrid size={11} className="text-[#0EA5E9]" />
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Template</span>
    </div>
    <div className="px-3 py-2">
      <div className={waBubble}>
        <p className="font-medium">{data.templateName || "welcome_lead"}</p>
        <p className="text-gray-400 text-[10px] mt-0.5">Meta approved template</p>
      </div>
    </div>
    <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#0EA5E9] !border-2 !border-white" />
    <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-[#0EA5E9] !border-2 !border-white" />
  </div>
);

const AgentNode = ({ data, selected }: any) => (
  <div className={`w-52 rounded-2xl bg-white shadow-md border-2 overflow-hidden transition-all ${selected ? "border-[#64748B]" : "border-gray-200"}`}>
    <div className="bg-gray-50 px-3 py-1.5 flex items-center gap-2 border-b border-gray-100">
      <UserCheck size={11} className="text-[#64748B]" />
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Handoff</span>
    </div>
    <div className="px-3 py-2 flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
        <UserCheck size={14} className="text-[#64748B]" />
      </div>
      <p className="text-[11px] font-medium text-gray-700">Request Agent Intervention</p>
    </div>
    <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-[#64748B] !border-2 !border-white" />
  </div>
);

// ─── Media Upload Panel ───────────────────────────────────────────────────────

function MediaUploadPanel({
  nodeId,
  data,
  onUpdate,
}: {
  nodeId: string;
  data: any;
  onUpdate: (id: string, key: string, value: any) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;

    const maxMB = 16;
    if (file.size > maxMB * 1024 * 1024) {
      toast.error(`File too large. Max ${maxMB}MB allowed.`);
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `flow-media/${nodeId}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("flow-assets")
        .upload(path, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("flow-assets")
        .getPublicUrl(path);

      const mediaType = file.type.startsWith("video")
        ? "video"
        : file.type.startsWith("image")
          ? "image"
          : "document";

      onUpdate(nodeId, "mediaUrl", urlData.publicUrl);
      onUpdate(nodeId, "mediaType", mediaType);
      onUpdate(nodeId, "mediaName", file.name);
      toast.success("Media uploaded successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed. Check your Supabase storage bucket.");
    } finally {
      setUploading(false);
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDropZone = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDropZone}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
          dragOver ? "border-[#0084FF] bg-blue-50" : "border-gray-200 hover:border-[#0084FF] hover:bg-blue-50/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx"
          className="hidden"
          onChange={onFileChange}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <Loader2 size={24} className="text-[#0084FF] animate-spin" />
            <p className="text-xs text-gray-400">Uploading...</p>
          </div>
        ) : data.mediaUrl ? (
          <div className="space-y-2">
            {data.mediaType === "image" ? (
              <img src={data.mediaUrl} alt="Preview" className="w-full h-28 object-cover rounded-lg" />
            ) : data.mediaType === "video" ? (
              <video src={data.mediaUrl} className="w-full h-28 object-cover rounded-lg" controls />
            ) : (
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                <FileText size={20} className="text-[#0084FF]" />
                <span className="text-xs text-gray-600 truncate">{data.mediaName}</span>
              </div>
            )}
            <p className="text-[10px] text-gray-400">Click or drag to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
              <Upload size={18} className="text-[#0084FF]" />
            </div>
            <p className="text-xs font-medium text-gray-600">Upload Image / Video / Doc</p>
            <p className="text-[10px] text-gray-400">Drag & drop or click · Max 16MB</p>
          </div>
        )}
      </div>

      {/* Caption */}
      <div>
        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Caption (optional)</label>
        <textarea
          rows={2}
          value={data.caption || ""}
          onChange={(e) => onUpdate(nodeId, "caption", e.target.value)}
          className="w-full text-xs border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#0084FF]/30"
          placeholder="Add a caption to your media..."
        />
      </div>

      {data.mediaUrl && (
        <button
          onClick={() => {
            onUpdate(nodeId, "mediaUrl", "");
            onUpdate(nodeId, "mediaType", "");
            onUpdate(nodeId, "mediaName", "");
          }}
          className="text-[10px] text-red-400 hover:text-red-600 flex items-center gap-1"
        >
          <Trash2 size={10} /> Remove media
        </button>
      )}
    </div>
  );
}


const nodeTypes = {
  trigger: TriggerNode,
  text_buttons: TextButtonsNode,
  media: MediaNode,
  list: ListNode,
  condition: ConditionNode,
  wait: WaitNode,
  template: TemplateNode,
  agent: AgentNode,
};


// ─── Initial canvas state ─────────────────────────────────────────────────────

const initialNodes: Node[] = [
  {
    id: "trigger-1",
    type: "trigger",
    data: { label: "Meta Lead Captured" },
    position: { x: 280, y: 40 },
  },
  {
    id: "msg-1",
    type: "text_buttons",
    data: {
      message: "Hi {{name}}! Thanks for your interest. Please select an option to continue...",
      buttons: ["View All Products", "Hot Deals!"],
    },
    position: { x: 200, y: 190 },
  },
  {
    id: "wait-1",
    type: "wait",
    data: { hours: 2 },
    position: { x: 200, y: 420 },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1",
    source: "trigger-1",
    target: "msg-1",
    animated: true,
    style: { stroke: "#25D366", strokeWidth: 2 },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#25D366" },
  },
  {
    id: "e2",
    source: "msg-1",
    target: "wait-1",
    animated: true,
    style: { stroke: "#25D366", strokeWidth: 2, strokeDasharray: "5,5" },
    markerEnd: { type: MarkerType.ArrowClosed, color: "#25D366" },
  },
];

// ─── Main page ────────────────────────────────────────────────────────────────

const WorkflowBuilder = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const flowId = searchParams.get("id");
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [flowName, setFlowName] = useState("Lead Nurture Flow");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (flowId) {
      const fetchFlow = async () => {
        const { data, error } = await supabase
          .from("automation_flow_definitions")
          .select("*")
          .eq("id", flowId)
          .single();

        if (data && !error) {
          setFlowName(data.name);
          if (data.nodes) setNodes(data.nodes as Node[]);
          if (data.edges) setEdges(data.edges as Edge[]);
        }
      };
      fetchFlow();
    }
  }, [flowId, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#25D366", strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#25D366" },
          },
          eds,
        ),
      ),
    [setEdges],
  );

  const onDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      const type = e.dataTransfer.getData("application/reactflow");
      if (!type || !rfInstance || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = rfInstance.screenToFlowPosition({
        x: e.clientX - bounds.left,
        y: e.clientY - bounds.top,
      });

      const id = `node-${Date.now()}`;
      const defaults: Record<string, any> = {
        text_buttons: { message: "Enter your message here...", buttons: ["Option 1", "Option 2"] },
        media: { caption: "Add a caption..." },
        list: { message: "Choose an option:", items: ["Item 1", "Item 2", "Item 3"] },
        condition: { condition: "Has Tag: Joined" },
        wait: { hours: 2 },
        template: { templateName: "welcome_lead" },
        agent: {},
      };

      setNodes((nds) =>
        nds.concat({
          id,
          type,
          position,
          data: defaults[type] || {},
        }),
      );
    },
    [rfInstance, setNodes],
  );

  const onDragStart = (e: DragEvent, type: string) => {
    e.dataTransfer.setData("application/reactflow", type);
    e.dataTransfer.effectAllowed = "move";
  };

  const onNodeClick = (_: any, node: Node) => setSelectedNode(node);
  const onPaneClick = () => setSelectedNode(null);

  const deleteNode = (id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    setSelectedNode(null);
  };

  const updateNodeData = (id: string, key: string, value: any) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, [key]: value } } : n)),
    );
    setSelectedNode((prev) => (prev?.id === id ? { ...prev, data: { ...prev.data, [key]: value } } : prev));
  };

  const handleSave = async () => {
    if (!rfInstance) return;
    setIsSaving(true);
    try {
      const flow = rfInstance.toObject();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        name: flowName,
        workspace_id: user.id, // Assuming user.id is workspace_id for simple mock, in real apps it would be state.workspaceId
        nodes: flow.nodes,
        edges: flow.edges,
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      let error;
      if (flowId) {
        const { error: updateError } = await supabase
          .from("automation_flow_definitions")
          .update(payload)
          .eq("id", flowId);
        error = updateError;
      } else {
        const { data, error: insertError } = await supabase
          .from("automation_flow_definitions")
          .insert(payload)
          .select()
          .single();
        error = insertError;
        if (data && !error) {
           navigate(`/automations/builder?id=${data.id}`, { replace: true });
        }
      }

      if (error) throw error;
      toast.success("Flow saved successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(`Error saving flow: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-full overflow-hidden bg-gray-50">
        <AppSidebar />

        {/* Left Block Sidebar */}
        <div className="w-52 bg-white border-r border-gray-200 flex flex-col shrink-0 z-10 shadow-sm">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Content Block</p>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            {CONTENT_BLOCKS.map((block) => {
              const Icon = block.icon;
              return (
                <div
                  key={block.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, block.type)}
                  className="flex items-center gap-3 px-4 py-2.5 cursor-grab hover:bg-gray-50 transition-colors active:cursor-grabbing select-none"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: block.bg }}
                  >
                    <Icon size={14} style={{ color: block.color }} />
                  </div>
                  <span className="text-[12px] font-medium text-gray-700">{block.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-5 shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/automations")}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft size={18} className="text-gray-600" />
              </button>
              <input
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                className="text-sm font-semibold text-gray-800 bg-transparent border-none outline-none focus:bg-gray-50 rounded px-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 text-xs"
                onClick={() => navigate("/automations")}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-[#25D366] hover:bg-[#1EBE5A] text-white gap-1.5 text-xs"
                onClick={handleSave}
              >
                <Save size={13} />
                Save Flow
              </Button>
            </div>
          </header>

          {/* Canvas + Properties Panel */}
          <div className="flex-1 flex overflow-hidden">
            <div ref={reactFlowWrapper} className="flex-1 relative">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onInit={setRfInstance}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3 }}
                defaultEdgeOptions={{ animated: true }}
              >
                <Background color="#e5e7eb" gap={20} size={1} />
                <Controls className="!shadow-md !rounded-xl !border-gray-200" />
              </ReactFlow>

              {/* Drop hint */}
              {nodes.length <= 1 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center text-gray-300">
                    <Plus size={40} className="mx-auto mb-2" />
                    <p className="text-sm font-medium">Drag blocks from the left panel onto the canvas</p>
                  </div>
                </div>
              )}
            </div>

            {/* Properties Panel */}
            {selectedNode && (
              <div className="w-72 bg-white border-l border-gray-200 flex flex-col overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-gray-800">Step Settings</h2>
                  <div className="flex gap-1">
                    <button
                      onClick={() => deleteNode(selectedNode.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Text + Buttons */}
                  {selectedNode.type === "text_buttons" && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Message</label>
                        <textarea
                          rows={4}
                          value={selectedNode.data.message || ""}
                          onChange={(e) => updateNodeData(selectedNode.id, "message", e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#25D366]/30"
                          placeholder="Type your WhatsApp message..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Buttons (one per line)</label>
                        <textarea
                          rows={3}
                          value={(selectedNode.data.buttons || []).join("\n")}
                          onChange={(e) => updateNodeData(selectedNode.id, "buttons", e.target.value.split("\n").filter(Boolean))}
                          className="w-full text-xs border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#25D366]/30"
                          placeholder={"View Products\nHot Deals!"}
                        />
                      </div>
                    </>
                  )}

                  {/* Media */}
                  {selectedNode.type === "media" && (
                    <MediaUploadPanel
                      nodeId={selectedNode.id}
                      data={selectedNode.data}
                      onUpdate={updateNodeData}
                    />
                  )}


                  {/* List */}
                  {selectedNode.type === "list" && (
                    <>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Prompt Message</label>
                        <input
                          value={selectedNode.data.message || ""}
                          onChange={(e) => updateNodeData(selectedNode.id, "message", e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">Items (one per line)</label>
                        <textarea
                          rows={4}
                          value={(selectedNode.data.items || []).join("\n")}
                          onChange={(e) => updateNodeData(selectedNode.id, "items", e.target.value.split("\n").filter(Boolean))}
                          className="w-full text-xs border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30"
                        />
                      </div>
                    </>
                  )}

                  {/* Condition */}
                  {selectedNode.type === "condition" && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Condition</label>
                      <input
                        value={selectedNode.data.condition || ""}
                        onChange={(e) => updateNodeData(selectedNode.id, "condition", e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/30"
                        placeholder="Has Tag: Joined"
                      />
                    </div>
                  )}

                  {/* Wait */}
                  {selectedNode.type === "wait" && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Wait (hours)</label>
                      <input
                        type="number"
                        min={1}
                        value={selectedNode.data.hours || 2}
                        onChange={(e) => updateNodeData(selectedNode.id, "hours", parseInt(e.target.value))}
                        className="w-full text-xs border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30"
                      />
                    </div>
                  )}

                  {/* Template */}
                  {selectedNode.type === "template" && (
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1.5 block">Template Name</label>
                      <input
                        value={selectedNode.data.templateName || ""}
                        onChange={(e) => updateNodeData(selectedNode.id, "templateName", e.target.value)}
                        className="w-full text-xs border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/30"
                        placeholder="welcome_lead"
                      />
                    </div>
                  )}

                  {/* Node ID display */}
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-[10px] text-gray-300">Node ID: {selectedNode.id}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default () => (
  <ReactFlowProvider>
    <WorkflowBuilder />
  </ReactFlowProvider>
);
