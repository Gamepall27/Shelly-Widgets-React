export default function WidgetFrame({ title, icon, color, children }) {
  return (
      <div className="widget-frame" style={{ "--accent": color }}>
        <div className="widget-header">
          <span className="widget-icon">{icon}</span>
          <span className="widget-title">{title}</span>
        </div>

        <div className="widget-content">
          {children}
        </div>
      </div>
  );
}
