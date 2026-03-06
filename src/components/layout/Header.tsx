import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AudioLines } from 'lucide-react';

interface HeaderProps {
  showNewButton?: boolean;
  rightContent?: React.ReactNode;
}

export function Header({ showNewButton = false, rightContent }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <AudioLines className="h-5 w-5 text-primary" />
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
