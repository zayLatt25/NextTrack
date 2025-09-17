interface RecommendationButtonProps {
  onGetRecommendations: () => void;
  loading: boolean;
  errorMessage: string | null;
}

export default function RecommendationButton({
  onGetRecommendations,
  loading,
  errorMessage,
}: RecommendationButtonProps) {
  return (
    <div className="flex-shrink-0">
      <button
        onClick={onGetRecommendations}
        className={`w-full px-6 py-4 rounded-xl disabled:opacity-50 flex items-center justify-center font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-2xl min-h-[56px] ${
          errorMessage 
            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600' 
            : 'bg-gradient-to-r from-purple-600 via-cyan-500 to-amber-500 text-white hover:from-purple-700 hover:via-cyan-600 hover:to-amber-600'
        }`}
        disabled={loading}
      >
        {loading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin h-7 w-7 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C6.477 0 2 4.477 2 10h2zm2 5.291A7.962 7.962 0 014 12H2c0 3.042 1.135 5.824 3 7.938l1-1.647z"></path>
            </svg>
          </div>
        ) : errorMessage ? (
          errorMessage
        ) : (
          'Get Recommendations'
        )}
      </button>
    </div>
  );
}
