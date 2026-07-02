const EditorToolbar = ({ language, roomCode }) => (
  <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900 border-b border-zinc-800 text-sm text-zinc-400">
    <span className="font-mono">{language}</span>
    <span className="text-zinc-700">·</span>
    <span>Room: <span className="font-mono text-zinc-300">{roomCode}</span></span>
  </div>
);

export default EditorToolbar;