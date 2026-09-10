import { stats } from "@/data/stats";

export function Stats() {
  return (
    <section className="border-t border-border/60 py-16">
      <div className="mx-auto grid w-full max-w-[1240px] gap-10 px-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="border-l border-brand/50 pl-5">
            <p className="font-display text-[2.4rem] font-bold leading-none">{s.value}</p>
            <p className="label-kicker mt-3">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
