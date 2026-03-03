import ToolLayout from './ToolLayout';
import MergeTool from './tools/MergeTool';
import SplitTool from './tools/SplitTool';
import RotateTool from './tools/RotateTool';
import DeletePagesTool from './tools/DeletePagesTool';
import ReorderTool from './tools/ReorderTool';
import CompressTool from './tools/CompressTool';
import ResizeTool from './tools/ResizeTool';
import { toolDefs } from '../tools';
import type { ToolId } from '../tools';

const toolComponents: Record<ToolId, React.ComponentType> = {
  merge: MergeTool,
  split: SplitTool,
  rotate: RotateTool,
  delete: DeletePagesTool,
  reorder: ReorderTool,
  compress: CompressTool,
  resize: ResizeTool,
};

interface ToolPageProps {
  toolId: ToolId;
}

export default function ToolPage({ toolId }: ToolPageProps) {
  const def = toolDefs.find((t) => t.id === toolId)!;
  const ToolComponent = toolComponents[toolId];

  return (
    <ToolLayout title={def.name} description={def.description} icon={def.icon}>
      <ToolComponent />
    </ToolLayout>
  );
}
