export type QA = { q: string; a: React.ReactNode };

/** First-timer questions as a native accordion. */
export default function FAQ({ items }: { items: QA[] }) {
  return (
    <div className="faq">
      {items.map((item, i) => (
        <details className="faq__item" key={item.q} open={i === 0}>
          <summary className="faq__q">
            <span>{item.q}</span>
            <span className="faq__icon" aria-hidden />
          </summary>
          <div className="faq__a">{item.a}</div>
        </details>
      ))}
    </div>
  );
}
