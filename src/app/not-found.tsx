import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <span className="text-6xl">🪔</span>
      <h1 className="mt-6 text-3xl">Page nahi mila</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-ink/60">
        Jo page aap dhoondh rahe hain wo yahan nahi hai — shayad link purana ho gaya ho.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary px-6 py-2.5">
          Home
        </Link>
        <Link href="/pujas" className="btn-secondary px-6 py-2.5">
          Upcoming Pujas
        </Link>
      </div>
    </div>
  );
}
