import { PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({
  icon: Icon = PackageOpen,
  title,
  desc,
  actionLabel,
  actionTo,
  children,
}) {
  return (
    <div className="editorial-empty-state">
      <div className="editorial-empty-state__icon-wrap">
        <Icon size={26} aria-hidden="true" />
      </div>
      <h2 className="editorial-empty-state__title">{title}</h2>
      {desc && <p className="editorial-empty-state__desc">{desc}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="btn btn-primary editorial-empty-state__btn">
          {actionLabel}
        </Link>
      )}
      {children && <div className="editorial-empty-state__children">{children}</div>}
    </div>
  );
}
