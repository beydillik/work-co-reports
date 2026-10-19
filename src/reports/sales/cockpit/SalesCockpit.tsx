// Sales cockpit: guided preparation workflow for the Sales Report.
// Left: the six steps. Right: the selected step (placeholder content for now).
import { useState } from 'react';
import { Stepper } from '../../../ui/Stepper';
import { StatusBadge } from '../../../ui/StatusBadge';
import { href } from '../../../app/router';
import { salesCockpitSteps } from './steps';

export function SalesCockpit() {
  const [activeId, setActiveId] = useState(salesCockpitSteps[0].id);
  const activeIndex = salesCockpitSteps.findIndex((s) => s.id === activeId);
  const active = salesCockpitSteps[activeIndex];
  const previous = salesCockpitSteps[activeIndex - 1];
  const next = salesCockpitSteps[activeIndex + 1];

  return (
    <section>
      <p className="breadcrumb">
        <a href={href('/')}>Home</a> / Sales / Cockpit
      </p>
      <h1>Sales – Cockpit</h1>
      <div className="cockpit">
        <Stepper steps={salesCockpitSteps} activeId={activeId} onSelect={setActiveId} />
        <article className="panel">
          <header className="panel-header">
            <h2>
              Step {activeIndex + 1}: {active.title}
            </h2>
            <StatusBadge status={active.status} />
          </header>
          <p>{active.description}</p>
          <p className="placeholder">Placeholder – this step is not implemented yet.</p>
          <footer className="panel-footer">
            <button type="button" disabled={!previous} onClick={() => previous && setActiveId(previous.id)}>
              Back
            </button>
            <button type="button" disabled={!next} onClick={() => next && setActiveId(next.id)}>
              Next
            </button>
          </footer>
        </article>
      </div>
    </section>
  );
}
