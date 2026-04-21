import { Wordmark } from "./Wordmark";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="wordmark-slot">
        <Wordmark size={28} mode="gradient" />
      </div>
      <nav>
        <ul className="site-nav">
          <li><a href="#">Home</a></li>
          <li><a href="#">Products</a></li>
          <li><a href="#">About</a></li>
          <li><a href="#">Near You</a></li>
          <li><a href="#" className="active">Contact</a></li>
        </ul>
      </nav>
      <div className="nav-right">
        <button type="button" className="nav-cta">COAs</button>
        <button type="button" className="nav-cta solid">Shop</button>
      </div>
    </header>
  );
}