const RoomLobby = ({ roomCode }) => (
  <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
    <h2 className="text-xl font-semibold text-white">Waiting for participant...</h2>
    <p className="text-zinc-400 text-sm">Share this room code:</p>
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-6 py-3 font-mono text-2xl text-white tracking-widest">
      {roomCode}
    </div>
    <p className="text-zinc-600 text-xs">The session will begin once both participants have joined.</p>
  </div>
);

export default RoomLobby;