interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  className?: string;
}

export default function EmptyState({ icon, title, description, className = "" }: EmptyStateProps) {
  return (
    <div className={`text-center py-8 text-gray-500 ${className}`}>
      <div className="text-4xl mb-2">{icon}</div>
      <p className="font-medium text-gray-700">{title}</p>
      <p className="text-sm text-gray-500 mt-1">{description}</p>
    </div>
  );
}
