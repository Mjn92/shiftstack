import SectionHeader from "./SectionHeader";

export default function DashboardSection({
  title,
  children,
  sectionStyle,
  titleStyle,
  gridStyle,
  headingId,
}) {
  return (
    <section style={sectionStyle} aria-labelledby={headingId}>
      <SectionHeader title={title} style={titleStyle} id={headingId} />

      <div style={gridStyle}>{children}</div>
    </section>
  );
}
