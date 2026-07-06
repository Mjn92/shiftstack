import Link from "next/link";

export default function QuickActionCard({ title, href }) {
  return (
    <Link
      href={href}
      className="block bg-white rounded-xl shadow p-6 hover:bg-gray-50"
    >
      <h3 className="font-bold text-lg">{title}</h3>
      <p className="text-sm text-gray-500 mt-2">Open {title}</p>
    </Link>
  );
}
