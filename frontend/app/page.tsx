export default function HomePage() {
  return (
    <section className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center space-y-6">

        {/* Tombol navigasi */}
        <div className="flex flex-col md:flex-row gap-4 justify-center mt-6">
          <a
            href="/auth/admin/login"
            className="px-6 py-3 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
          >
            Admin Login
          </a>
          <a
            href="/auth/employee/login"
            className="px-6 py-3 rounded border border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition"
          >
            Employee Login
          </a>
        </div>
      </div>
    </section>
  );
}
