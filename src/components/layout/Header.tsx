import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  showNewButton?: boolean;
  rightContent?: React.ReactNode;
}

export function Header({ showNewButton = false, rightContent }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/90 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-6 sm:px-8 flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-neutral-900">
          <img src="/logo.png" alt="Logo" className="h-7 w-7 rounded-lg object-cover" />
          <span>MeetingsTranscript</span>
        </Link>
        <div className="flex items-center gap-3">
          {showNewButton && (
            <Link href="/dashboard/new">
              <Button size="sm">Nova Transcricao</Button>
            </Link>
          )}
          {rightContent}
        </div>
      </div>
    </header>
  );
}
