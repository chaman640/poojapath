export default function SectionHeading({
  title,
  subtitle,
  align = "center",
}: {
  title: string;
  subtitle?: string;
  align?: "center" | "left";
}) {
  if (align === "left") {
    return (
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl">{title}</h2>
        <div className="mt-3 h-px w-24 bg-gold-line" />
        {subtitle && (
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink/65">
            {subtitle}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mb-10">
      <h2 className="section-title">{title}</h2>
      <div className="divider-gold mt-4" />
      {subtitle && <p className="section-sub">{subtitle}</p>}
    </div>
  );
}
