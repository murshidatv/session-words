function Header() {
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-mark">SW</div>

        <div>
          <h1>Session Words</h1>
          <p>Turn mentoring conversations into clear insights.</p>
        </div>
      </div>

      <div className="limit-badge">
        Up to 25 MB or 10 min
      </div>
    </header>
  );
}

export default Header;