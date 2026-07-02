import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

const Home = () => (
  <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 text-center">
    <div className="max-w-2xl">
      <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-6">
        <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
        <span className="text-blue-400 text-sm font-medium">Real-time collaborative code review</span>
      </div>
      <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
        Code together,<br />review in real time
      </h1>
      <p className="text-zinc-400 text-lg mb-8 max-w-lg mx-auto">
        DevSync brings interviewers and candidates into a shared editor with live sync, inline comments, and AI-powered code review.
      </p>
      <div className="flex gap-4 justify-center">
        <Link to="/signup">
          <Button variant="primary" className="px-6 py-3 text-base">Get started</Button>
        </Link>
        <Link to="/login">
          <Button variant="ghost" className="px-6 py-3 text-base">Sign in</Button>
        </Link>
      </div>
    </div>
  </div>
);

export default Home;