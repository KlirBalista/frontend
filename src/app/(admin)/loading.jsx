export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/30 via-pink-50/20 to-white py-8">
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#BF3853] mx-auto"></div>
          <p className="mt-4 text-gray-700 font-semibold">Loading...</p>
        </div>
      </div>
    </div>
  );
}
