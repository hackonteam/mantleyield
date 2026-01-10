import { AlertTriangle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/30 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="font-medium text-foreground/80">Risk Notice</p>
            <p>
              This vault deploys assets to DeFi protocols. While withdrawal is always available,
              actual returns depend on underlying protocol performance. This is not financial advice.
              Past performance does not guarantee future results.
            </p>
            <p className="text-xs">
              <strong>No Guaranteed Returns:</strong> This vault does not guarantee any specific yield or APY.
              Returns depend on the performance of underlying strategies and may be zero or negative.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
