const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button',
  ...props 
}) => {
  // Base required styles matching Process Payment and Add Service buttons
  const baseStyles = "inline-flex items-center justify-center border border-transparent rounded-xl text-sm font-normal transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Size variants
  const sizeStyles = {
    sm: "px-3 py-1.5",
    md: "px-4 py-2",
    lg: "px-6 py-2.5"
  };
  
  // Color variants - Using pink color palette
  const variantStyles = {
    primary: "bg-[#A41F39] text-white hover:bg-[#BF3853] hover:shadow-lg hover:shadow-[#A41F39]/25 focus:ring-[#A41F39] hover:scale-105",
    secondary: "border-[#FDB3C2] text-gray-700 bg-white hover:bg-[#FDB3C2]/20 focus:ring-[#E56D85]",
    outline: "bg-white border-2 border-[#E56D85] text-[#E56D85] hover:bg-[#A41F39] hover:text-white focus:ring-[#E56D85] hover:shadow-lg hover:shadow-[#A41F39]/25 hover:scale-105",
    danger: "bg-[#BF3853] text-white hover:bg-[#A41F39] hover:shadow-lg hover:shadow-[#BF3853]/25 focus:ring-[#BF3853] hover:scale-105",
    success: "bg-[#A41F39] text-white hover:bg-[#BF3853] hover:shadow-lg hover:shadow-[#A41F39]/25 focus:ring-[#A41F39] hover:scale-105",
    warning: "bg-[#F891A5] text-white hover:bg-[#E56D85] hover:shadow-lg hover:shadow-[#F891A5]/25 focus:ring-[#F891A5] hover:scale-105"
  };
  
  // Build final className
  const finalClassName = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`.trim();
  
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={finalClassName}
      {...props}
    >
      {loading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {typeof children === 'string' ? 'Loading...' : children}
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
