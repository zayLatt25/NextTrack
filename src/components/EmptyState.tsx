interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  className?: string;
}

export default function EmptyState({ icon, title, description, className = "" }: EmptyStateProps) {
  return (
    <div className={`text-center py-8 text-white/60 ${className}`}>
      <div className="text-5xl mb-4 filter drop-shadow-lg">{icon}</div>
      <p className="font-bold text-white/90 text-lg mb-2">{title}</p>
      <p className="text-sm text-white/60 leading-relaxed">{description}</p>
    </div>
  );
}
