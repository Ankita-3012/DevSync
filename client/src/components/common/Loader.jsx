const Loader = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center gap-3">
    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    <p className="text-zinc-400 text-sm">{message}</p>
  </div>
);

export default Loader;