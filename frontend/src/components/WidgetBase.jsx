export default function WidgetBase({ title, color, onDoubleClick, children }) {
  return (
    <div
      className="widget-base"
      onDoubleClick={onDoubleClick}
      style={{ borderColor: color }}
    >
      <div className="widget-header">
        <span className="widget-title">{title}</span>
      </div>
      <div className="widget-content">{children}</div>
    </div>
  );
}
