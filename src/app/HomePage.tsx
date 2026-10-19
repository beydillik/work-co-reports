// Home page: one card per report. Available reports link to their cockpit;
// planned reports are shown greyed out as "Coming soon".
import { reports } from '../reports/registry';
import { href } from './router';

export function HomePage() {
  return (
    <section>
      <h1>Reports</h1>
      <div className="cards">
        {reports.map((report) =>
          report.status === 'available' ? (
            <a key={report.id} className="card" href={href(`/${report.id}/cockpit`)}>
              <h2>{report.title}</h2>
              <p>{report.description}</p>
              <p className="card-meta">Last approved period: – · Cockpit: not started</p>
            </a>
          ) : (
            <div key={report.id} className="card card-disabled" aria-disabled="true">
              <h2>{report.title}</h2>
              <p>{report.description}</p>
              <p className="card-meta">Coming soon</p>
            </div>
          ),
        )}
      </div>
    </section>
  );
}
