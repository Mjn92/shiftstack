export default function SectionHeader({ title, style, id }) {
  return (
    <h2 id={id} style={style}>
      {title}
    </h2>
  );
}
