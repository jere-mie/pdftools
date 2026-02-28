import { useState } from 'react';
import type { ToolId } from './tools';
import { toolDefs } from './tools';
import Landing from './components/Landing';
import ToolLayout from './components/ToolLayout';
import MergeTool from './components/tools/MergeTool';
import SplitTool from './components/tools/SplitTool';
import RotateTool from './components/tools/RotateTool';
import DeletePagesTool from './components/tools/DeletePagesTool';
import ReorderTool from './components/tools/ReorderTool';
import CompressTool from './components/tools/CompressTool';
import ResizeTool from './components/tools/ResizeTool';

const toolComponents: Record<ToolId, React.ComponentType> = {
  merge: MergeTool,
  split: SplitTool,
  rotate: RotateTool,
  delete: DeletePagesTool,
  reorder: ReorderTool,
  compress: CompressTool,
  resize: ResizeTool,
};

function App() {
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);

  if (!activeTool) {
    return <Landing onSelectTool={setActiveTool} />;
  }

  const def = toolDefs.find((t) => t.id === activeTool)!;
  const ToolComponent = toolComponents[activeTool];

  return (
    <ToolLayout
      title={def.name}
      description={def.description}
      icon={def.icon}
      onBack={() => setActiveTool(null)}
    >
      <ToolComponent />
    </ToolLayout>
  );
}

export default App;
