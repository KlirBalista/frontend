const IconLogo = ({ size = "h-12 w-12", iconSize = "h-7 w-7" }) => (
  <div className="relative group">
    <div className={`flex ${size} items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff6b6b] to-[#ff5252] shadow-lg shadow-pink-500/30 group-hover:shadow-pink-500/40 transition-all duration-300 group-hover:scale-110`}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconSize} text-white transform group-hover:scale-110 transition-transform duration-300`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </div>
    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br from-[#ff6b6b] to-[#ff5252] opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-300`}></div>
  </div>
);

export default IconLogo;
