const Button = ({ children, onClick, type = 'button', variant = 'primary', disabled = false, className = '' }) => {
  const base = 'px-4 py-2 rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-zinc-700 text-white hover:bg-zinc-600',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent text-zinc-300 hover:bg-zinc-800',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;