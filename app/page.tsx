import { WorkspaceLayout } from '@/components/workspace/WorkspaceLayout';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
        <header className="mb-6 flex-shrink-0">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            <span className="text-4xl">🐼</span> Sese
          </h1>
          <p className="text-slate-500 font-medium">Your AI Study Companion</p>
        </header>
        
        <div className="flex-1 min-h-0">
          <WorkspaceLayout />
        </div>
      </div>
    </main>
  );
}
