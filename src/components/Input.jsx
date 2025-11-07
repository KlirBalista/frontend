const Input = ({ disabled = false, className = "", ...props }) => (
  <input
    disabled={disabled}
    className={`${className} px-4 py-3 rounded-lg border-2 border-gray-200 bg-white shadow-sm transition-all duration-200 focus:border-[#BF3853] focus:ring-4 focus:ring-[#FDB3C2]/20 focus:outline-none hover:border-gray-300 disabled:bg-gray-50 disabled:cursor-not-allowed`.trim()}
    {...props}
  />
);

export default Input;
