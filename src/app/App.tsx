// Application shell: header plus the page selected by the current hash route.
import { HomePage } from './HomePage';
import { useHashPath, href } from './router';
import { SalesCockpit } from '../reports/sales/cockpit/SalesCockpit';

function NotFound() {
  return (
    <section>
      <h1>Page not found</h1>
      <p>
        <a href={href('/')}>Back to home</a>
      </p>
    </section>
  );
}

export function App() {
  const path = useHashPath();
  let page;
  if (path === '/') page = <HomePage />;
  else if (path === '/sales/cockpit') page = <SalesCockpit />;
  else page = <NotFound />;

  return (
    <>
      <header className="topbar">
        <a href={href('/')} className="brand">
          CO Reports
        </a>
        <span className="topbar-note">Synthetic sample data</span>
      </header>
      <main>{page}</main>
    </>
  );
}
