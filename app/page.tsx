/**
 * @file page.tsx
 * @description The main entry point for the Sese app.
 *
 * Use Cases:
 * - Renders the global app header.
 * - Mounts the WorkspaceLayout component.
 */

import { WorkspaceLayout } from '@/components/workspace/WorkspaceLayout';

export default function Home() {
  return (
    <main className="min-h-screen p-4 md:p-8 md:px-10">
      <div className="max-w-[1600px] mx-auto h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] flex flex-col">
        <header className="mb-8 md:mb-10 flex-shrink-0">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-normal tracking-tight text-[#0A0A0A]">
              Sese
            </h1>
            <span className="text-[#FF6A00] text-xl md:text-2xl" aria-hidden>
              ·
            </span>
            <p className="text-sm md:text-base font-medium text-[#6B7280] tracking-wide">
              Study companion
            </p>
          </div>
          <p className="mt-2 text-sm text-[#9CA3AF] max-w-lg leading-relaxed">
            Multimodal tutoring — minimal, focused, built for real sessions.
          </p>
        </header>

        <div className="flex-1 min-h-0">
          <WorkspaceLayout />
        </div>
      </div>
    </main>
  );
}
