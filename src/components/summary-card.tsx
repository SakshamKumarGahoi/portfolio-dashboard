interface SummaryCardProps {
  label: string;
  value: string;
  detail?: string;
  positive?: boolean;
  negative?: boolean;
  className?: string;
}

export default function SummaryCard({
  label,
  value,
  detail,
  positive = false,
  negative = false,
  className = "",
}: SummaryCardProps) {
  return (
    <article
      className={`group relative min-h-[188px] overflow-hidden rounded-[28px] bg-[#0c2024] p-6 text-white transition duration-300 hover:-translate-y-1 hover:shadow-xl md:p-7 ${className}`}
    >
      {/* subtle decorative glow */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-[#8de4f2]/5 blur-2xl transition duration-500 group-hover:bg-[#8de4f2]/10" />

      {/* arrow */}
      <div className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-full bg-[#17343a] text-[#8de4f2] transition duration-300 group-hover:translate-x-1">
        →
      </div>

      <p className="text-xs font-semibold uppercase tracking-[0.17em] text-[#8da4aa]">
        {label}
      </p>

      <div className="mt-9 max-w-[85%]">
        <h2
          className={`font-display text-3xl leading-tight tracking-tight md:text-4xl ${
            label === "Best Performer"
              ? "truncate"
              : ""
          }`}
          title={value}
        >
          {value}
        </h2>

        {detail && (
          <p
            className={`mt-3 text-sm ${
              positive
                ? "text-[#63d471]"
                : negative
                  ? "text-[#f07878]"
                  : "text-[#8da4aa]"
            }`}
          >
            {detail}
          </p>
        )}
      </div>

      {/* bottom accent */}
      <div
        className={`absolute bottom-0 left-6 right-6 h-px ${
          positive
            ? "bg-[#63d471]/30"
            : negative
              ? "bg-[#f07878]/30"
              : "bg-[#8de4f2]/15"
        }`}
      />
    </article>
  );
}