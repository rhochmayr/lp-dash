export function WalletGridHeader() {
  return (
    <div className="grid grid-cols-[250px_repeat(24,minmax(40px,1fr))] gap-2 items-center px-4 text-sm text-muted-foreground">
      <div>Node Address</div>
      {Array.from({ length: 24 }, (_, i) => (
        <div key={`header-${i}`} className="text-center">
          {i.toString().padStart(2, '0')}:00
        </div>
      ))}
    </div>
  );
}