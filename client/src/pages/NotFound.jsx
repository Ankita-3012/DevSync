import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

const NotFound = () => (
  <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-center px-4">
    <h1 className="text-6xl font-bold text-zinc-700 mb-4">404</h1>
    <p className="text-zinc-400 mb-6">This page doesn't exist.</p>
    <Link to="/"><Button variant="ghost">Go home</Button></Link>
  </div>
);

export default NotFound;