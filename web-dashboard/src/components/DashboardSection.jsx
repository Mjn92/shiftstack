import SectionHeader from "./SectionHeader";

export default function DashboardSection({
  title,
  children,
  sectionStyle,
  titleStyle,
  gridStyle,
}) {
  return (
    <section style={sectionStyle}>
      <SectionHeader title={title} style={titleStyle} />

      <div style={gridStyle}>{children}</div>
    </section>
  );
}
