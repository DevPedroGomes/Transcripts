import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  showNewButton?: boolean;
  rightContent?: React.ReactNode;
}

export function Header({ showNewButton = false, rightContent }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="text-xl">MeetingsTranscript</span>
        </Link>
        <div className="flex items-center gap-2">
          {showNewButton && (
            <Link href="/dashboard/new">
              <Button size="sm">Nova Transcrição</Button>
            </Link>
          )}
          {rightContent}
        </div>
      </div>
    </header>
  );
}
