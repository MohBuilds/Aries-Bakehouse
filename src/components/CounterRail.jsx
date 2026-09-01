import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export default function CounterRail({ categories }) {
  if (!categories?.length) return null;

  return (
    <section id="menu-preview" className="container category-showcase category-showcase--editorial" aria-labelledby="category-showcase-title">
      <div className="category-showcase__editorial-heading">
        <h2 id="category-showcase-title">The counter is yours.</h2>
        <div>
          <p>Choose a category, then make every detail your own.</p>
          <Link to="/menu">View the full menu <ArrowUpRight size={15} aria-hidden="true" /></Link>
        </div>
      </div>

      <div className="category-showcase__grid" role="list">
        {categories.map((category, index) => (
          <Link
            key={category.id}
            to={`/menu/${category.id}`}
            className="category-showcase__item"
            role="listitem"
          >
            <span className="category-showcase__copy">
              <strong>{category.name}</strong>
              {category.desc && <span>{category.desc}</span>}
            </span>
            <span className="category-showcase__index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
            <ArrowUpRight className="category-showcase__arrow" size={22} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
