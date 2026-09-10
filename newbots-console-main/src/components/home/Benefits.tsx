import { Gauge, LifeBuoy, Sliders, Workflow } from "lucide-react";

const benefits = [
  {
    icon: Gauge,
    title: "Performance",
    text: "Bots e sistemas desenvolvidos para executar de forma rápida e estável.",
  },
  {
    icon: Workflow,
    title: "Automação",
    text: "Reduza tarefas manuais e automatize processos do seu servidor.",
  },
  {
    icon: Sliders,
    title: "Configuração simples",
    text: "Configure seus sistemas diretamente pela Área do Cliente.",
  },
  {
    icon: LifeBuoy,
    title: "Suporte",
    text: "Tenha acesso à nossa equipe sempre que precisar de ajuda.",
  },
];

export function Benefits() {
  return (
    <section id="por-que" className="border-t border-border/60 py-24">
      <div className="mx-auto w-full max-w-[1240px] px-5">
        <p className="label-kicker">Por que NEXO NETWORK</p>
        <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2 className="text-[2rem] font-bold leading-[1.1] sm:text-[2.6rem]">
            Feito para quem precisa de <span className="text-brand">controle.</span>
          </h2>
          <p className="max-w-[52ch] text-sm leading-relaxed text-muted-foreground">
            Cada sistema é desenvolvido pensando em automação, organização e facilidade de uso.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-[2px] border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <article
              key={b.title}
              className="group bg-surface p-7 transition-colors hover:bg-surface-2"
            >
              <b.icon className="size-5 text-brand" />
              <h3 className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground">
                {b.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{b.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
