import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createRoom, joinRoom } from '../services/roomService';
import Button from '../components/common/Button';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateRoom = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await createRoom(language);
      navigate(`/room/${res.data.room.roomCode}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!joinCode.trim()) return setError('Enter a room code');
    setError('');
    setLoading(true);
    try {
      await joinRoom(joinCode.trim());
      navigate(`/room/${joinCode.trim()}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-lg tracking-tight">DevSync</span>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 text-sm">{user?.email}</span>
          <Button variant="ghost" onClick={logout} className="text-sm">
            Sign out
          </Button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-2">Welcome, {user?.name}</h1>
        <p className="text-zinc-400 mb-10">
          {user?.role === 'interviewer'
            ? 'Create a new session and share the room code with your candidate.'
            : 'Enter a room code from your interviewer to join a session.'}
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
            {error}
          </div>
        )}

        <div className="grid gap-6">
          {/* Create room — shown to everyone but most relevant for interviewers */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="font-semibold text-lg mb-1">Create a room</h2>
            <p className="text-zinc-400 text-sm mb-4">
              Start a new session. Share the generated room code with your candidate.
            </p>
            <div className="flex gap-3 items-center">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="typescript">TypeScript</option>
              </select>
              <Button onClick={handleCreateRoom} disabled={loading}>
                {loading ? 'Creating...' : 'Create room'}
              </Button>
            </div>
          </div>

          {/* Join room */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="font-semibold text-lg mb-1">Join a room</h2>
            <p className="text-zinc-400 text-sm mb-4">
              Enter the room code your interviewer shared with you.
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="e.g. a1b2c3d4"
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
              <Button onClick={handleJoinRoom} disabled={loading} variant="secondary">
                {loading ? 'Joining...' : 'Join room'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;