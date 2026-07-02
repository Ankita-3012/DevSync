import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getRoom } from '../services/roomService';
import { getComments, createComment, getAIReview } from '../services/reviewService';
import CodeEditor from '../components/editor/CodeEditor';
import CommentThread from '../components/review/CommentThread';
import AIReviewPanel from '../components/review/AIReviewPanel';
import ParticipantList from '../components/room/ParticipantList';
import Button from '../components/common/Button';
import Loader from '../components/common/Loader';

const RoomPage = () => {
  const { roomCode } = useParams();
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState('');
  const [version, setVersion] = useState(0);
  const [comments, setComments] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [activePanel, setActivePanel] = useState('comments'); // 'comments' | 'ai'
  const versionRef = useRef(0);

  // Load room details
  useEffect(() => {
    const load = async () => {
      try {
        const res = await getRoom(roomCode);
        setRoom(res.data.room);
        const commentsRes = await getComments(roomCode);
        setComments(commentsRes.data.comments);
      } catch {
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [roomCode, navigate]);

  // Socket: join room + listen for events
  useEffect(() => {
    if (!socket || !room) return;

    socket.emit('join-room', { roomCode }, (res) => {
      if (res?.error) return navigate('/dashboard');
      setCode(res.content);
      setVersion(res.version);
      versionRef.current = res.version;
    });

    socket.on('code-op-applied', ({ op, version: newVersion, self }) => {
      if (self) {
        versionRef.current = newVersion;
        setVersion(newVersion);
        return;
      }
      setCode((prev) => applyOp(prev, op));
      versionRef.current = newVersion;
      setVersion(newVersion);
    });

    socket.on('comment-added', (comment) => {
      setComments((prev) => [...prev, comment]);
    });

    socket.on('user-joined', ({ userId }) => {
      setParticipants((prev) => prev.includes(userId) ? prev : [...prev, userId]);
    });

    socket.on('user-left', ({ userId }) => {
      setParticipants((prev) => prev.filter((id) => id !== userId));
    });

    return () => {
      socket.off('code-op-applied');
      socket.off('comment-added');
      socket.off('user-joined');
      socket.off('user-left');
    };
  }, [socket, room, roomCode, navigate]);

  // Client-side applyOp (mirrors server logic)
  const applyOp = (content, op) => {
    if (op.type === 'insert') {
      return content.slice(0, op.position) + op.text + content.slice(op.position);
    }
    if (op.type === 'delete') {
      return content.slice(0, op.position) + content.slice(op.position + op.length);
    }
    return content;
  };

  // Send a code operation
  const sendOp = (op) => {
    if (!socket) return;
    socket.emit('code-op', {
      roomCode,
      baseVersion: versionRef.current,
      op,
    });
  };

  const handleAddComment = async (lineNumber, text) => {
    try {
      const res = await createComment(roomCode, { lineNumber, text, snapshotVersion: version });
      const newComment = res.data.comment;
      setComments((prev) => [...prev, newComment]);
      socket?.emit('new-comment', { ...newComment, roomCode });
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  const handleAIReview = async () => {
    setAiLoading(true);
    setActivePanel('ai');
    try {
      const res = await getAIReview(roomCode);
      setAiSuggestions(res.data.suggestions);
    } catch (err) {
      console.error('AI review failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader message="Loading room..." />
      </div>
    );
  }

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm">DevSync</span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400 text-sm font-mono">{roomCode}</span>
          <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
            {room?.language}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <ParticipantList room={room} participants={participants} currentUser={user} />
          <Button variant="ghost" onClick={handleAIReview} disabled={aiLoading} className="text-sm">
            {aiLoading ? 'Reviewing...' : '✨ AI Review'}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="text-sm">
            Leave
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <CodeEditor
            code={code}
            setCode={setCode}
            language={room?.language || 'javascript'}
            sendOp={sendOp}
            versionRef={versionRef}
          />
        </div>

        {/* Side panel */}
        <div className="w-80 border-l border-zinc-800 flex flex-col overflow-hidden">
          <div className="flex border-b border-zinc-800 shrink-0">
            <button
              onClick={() => setActivePanel('comments')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                activePanel === 'comments'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Comments
            </button>
            <button
              onClick={() => setActivePanel('ai')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                activePanel === 'ai'
                  ? 'text-white border-b-2 border-blue-500'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              AI Review
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {activePanel === 'comments' ? (
              <CommentThread
                comments={comments}
                onAddComment={handleAddComment}
                currentUser={user}
              />
            ) : (
              <AIReviewPanel
                suggestions={aiSuggestions}
                loading={aiLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;