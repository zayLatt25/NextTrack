interface SkeletonLoaderProps {
  lines?: number;
  className?: string;
}

export default function SkeletonLoader({ lines = 3, className = "" }: SkeletonLoaderProps) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 bg-white/20 rounded-xl"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
}

export function TrackSkeleton() {
  return (
    <div className="animate-pulse flex items-center justify-between p-4 border border-white/20 rounded-xl bg-white/5">
      <div className="flex-1 space-y-3">
        <div className="h-4 bg-white/20 rounded-lg w-3/4"></div>
        <div className="h-3 bg-white/15 rounded-lg w-1/2"></div>
      </div>
      <div className="h-8 bg-white/20 rounded-lg w-16"></div>
    </div>
  );
}

export function RecommendationSkeleton() {
  return (
    <div className="p-5 bg-white/10 rounded-xl border border-white/20 animate-pulse">
      <div className="space-y-4">
        <div className="h-6 bg-white/20 rounded-lg w-4/5"></div>
        <div className="h-4 bg-white/15 rounded-lg w-3/4"></div>
        <div className="h-4 bg-white/15 rounded-lg w-2/3"></div>
        <div className="h-4 bg-white/15 rounded-lg w-1/4"></div>
        <div className="h-10 bg-white/20 rounded-xl w-24"></div>
      </div>
    </div>
  );
}
