// Vertical list of workflow steps with number, title and status; one step is active.
// Used by every report cockpit.
import type { CheckStatus } from '../checks/types';
import { StatusBadge } from './StatusBadge';

export interface StepperItem {
  id: string;
  title: string;
  status: CheckStatus;
}

interface Props {
  steps: StepperItem[];
  activeId: string;
  onSelect: (id: string) => void;
}

export function Stepper({ steps, activeId, onSelect }: Props) {
  return (
    <ol className="stepper">
      {steps.map((step, index) => (
        <li key={step.id}>
          <button
            type="button"
            className={step.id === activeId ? 'step active' : 'step'}
            aria-current={step.id === activeId ? 'step' : undefined}
            onClick={() => onSelect(step.id)}
          >
            <span className="step-number">{index + 1}</span>
            <span className="step-title">{step.title}</span>
            <StatusBadge status={step.status} />
          </button>
        </li>
      ))}
    </ol>
  );
}
