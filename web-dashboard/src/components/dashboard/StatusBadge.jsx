export default function StatusBadge({ status }) {
  const isClockedIn = status === "clocked_in" || status === true;

  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${
        isClockedIn
          ? "bg-green-100 text-green-700"
          : "bg-gray-200 text-gray-700"
      }`}
    >
      {isClockedIn ? "Clocked In" : "Clocked Out"}
    </span>
  );
}
