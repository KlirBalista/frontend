/**
 * Inline Loading Spinner Component
 * Use this for buttons, cards, or inline loading states
 */
const LoadingSpinner = ({ size = "medium", color = "red" }) => {
  const sizeClasses = {
    small: "h-4 w-4 border-2",
    medium: "h-6 w-6 border-2",
    large: "h-8 w-8 border-3"
  };

  const colorClasses = {
    red: "border-red-500 border-t-transparent",
    white: "border-white border-t-transparent",
    gray: "border-gray-500 border-t-transparent",
    pink: "border-[#E56D85] border-t-transparent"
  };

  return (
    <div
      className={`${sizeClasses[size]} ${colorClasses[color]} animate-spin rounded-full`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default LoadingSpinner;
