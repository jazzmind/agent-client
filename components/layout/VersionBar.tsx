'use client';

interface VersionBarProps {
  version?: string;
}

export function VersionBar({ version }: VersionBarProps) {
  if (!version) return null;
  return (
    <div className="w-full bg-gray-900 text-white text-xs px-3 py-1 text-center">
      Agent Client Version: {version}
    </div>
  );
}
