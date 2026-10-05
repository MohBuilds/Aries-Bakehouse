import { PackageOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function EmptyState({ icon: Icon = PackageOpen, title, headingLevel = 2, desc, actionLabel, actionTo, children }) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return (
    <div className="editorial-empty-state">
      <div className="editorial-empty-state__icon-wrap">
        <Icon size={26} aria-hidden="true" />
      </div>
      <Heading className="editorial-empty-state__title">{title}</Heading>
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
