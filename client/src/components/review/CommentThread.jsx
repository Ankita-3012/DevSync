import { useState } from 'react';
import Button from '../common/Button';

const CommentThread = ({ comments, onAddComment, currentUser }) => {
  const [lineNumber, setLineNumber] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || !lineNumber) return;
    setSubmitting(true);
    await onAddComment(parseInt(lineNumber), text.trim());
    setText('');
    setLineNumber('');
    setSubmitting(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {comments.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center mt-8">
            No comments yet. Add one below.
          </p>
        ) : (
          comments.map((c) => (
            <div key={c._id} className="bg-zinc-900 rounded-lg p-3 border border-zinc-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-blue-400">
                  {c.author?.name || 'Unknown'}
                </span>
                <span className="text-xs text-zinc-600">Line {c.lineNumber}</span>
              </div>
              <p className="text-sm text-zinc-300">{c.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Add comment */}
      <div className="border-t border-zinc-800 p-4 flex flex-col gap-2 shrink-0">
        <div className="flex gap-2">
          <input
            type="number"
            value={lineNumber}
            onChange={(e) => setLineNumber(e.target.value)}
            placeholder="Line #"
            className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500"
          />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-white text-sm placeholder-zinc-600 focus:outline-none focus:border-blue-500"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !text.trim() || !lineNumber}
          className="w-full text-sm"
        >
          {submitting ? 'Adding...' : 'Add comment'}
        </Button>
      </div>
    </div>
  );
};

export default CommentThread;