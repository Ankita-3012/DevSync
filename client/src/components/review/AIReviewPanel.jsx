import Loader from '../common/Loader';

const severityStyles = {
  error: 'border-red-500/30 bg-red-500/10 text-red-400',
  warning: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400',
  suggestion: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
};

const AIReviewPanel = ({ suggestions, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader message="Analyzing code..." />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-600 text-sm text-center px-4">
          Click "✨ AI Review" to analyze the current code.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-3">
      {suggestions.map((s, i) => (
        <div
          key={i}
          className={`border rounded-lg p-3 ${severityStyles[s.severity] || severityStyles.suggestion}`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold uppercase tracking-wide">
              {s.severity}
            </span>
            <span className="text-xs opacity-70">Line {s.line}</span>
          </div>
          <p className="text-sm">{s.message}</p>
        </div>
      ))}
    </div>
  );
};

export default AIReviewPanel;