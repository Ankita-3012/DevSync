const ParticipantList = ({ room, participants, currentUser }) => {
  const interviewer = room?.interviewer;
  const candidate = room?.candidate;

  return (
    <div className="flex items-center gap-2">
      {[interviewer, candidate].filter(Boolean).map((p) => (
        <div
          key={p._id}
          title={`${p.name} (${p._id === currentUser?.id ? 'you' : p.role || 'participant'})`}
          className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white"
        >
          {p.name?.[0]?.toUpperCase() || '?'}
        </div>
      ))}
    </div>
  );
};

export default ParticipantList;