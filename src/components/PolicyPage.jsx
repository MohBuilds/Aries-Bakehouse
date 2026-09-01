export default function PolicyPage({ title, sections }) {
  return (
    <div className="container content-page policy-page">
      <header className="content-page__header">
        <span className="page-kicker">Aries 11 Bakehouse</span>
        <h1 className="content-page__title">{title}</h1>
        <p className="content-page__subtitle">
          Our standards, kitchen commitments, and policies for a transparent ordering experience.
        </p>
      </header>
      <div className="policy-sections-list">
        {sections.map((s) => (
          <article key={s.heading} className="policy-section-card">
            <h2>{s.heading}</h2>
            <p>{s.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
