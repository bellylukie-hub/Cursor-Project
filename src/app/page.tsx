import Link from "next/link";

export default function HomePage() {
  return (
    <div className="home-hero">
      <div className="home-hero-inner">
        <span className="brand-mark">TTOCS</span>
        <h1>Truck Turnaround &amp; Operations Control System</h1>
        <p>
          One live operational record for every DRC trip — border clearance,
          Kanyaka, offloading, POD, loading, escort, and exit to Zambia.
        </p>
        <div className="home-cta">
          <Link href="/dashboard" className="primary">
            Open control tower
          </Link>
          <Link href="/nb" className="secondary">
            NB operations
          </Link>
        </div>
      </div>
    </div>
  );
}
