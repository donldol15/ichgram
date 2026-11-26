import { Link } from "react-router-dom";
import phones from "../../assets/phones.svg";
import "./NotFound.css";

const NotFound = () => {
  return (
    <main className="not-found-page">
      <section className="not-found-content">
        <div className="not-found-image">
          <img src={phones} alt="ICHgram phones" />
        </div>

        <div className="not-found-info">
          <h1>Oops! Page Not Found (404 Error)</h1>

          <p>
            We're sorry, but the page you're looking for doesn't seem to exist.
          </p>

          <p>
            If you typed the URL manually, please double-check the spelling.
          </p>

          <p>If you clicked on a link, it may be outdated or broken.</p>
        </div>
      </section>

      <footer className="not-found-footer">
        <nav className="not-found-footer-nav">
          <Link to="/home">Home</Link>
          <Link to="/search">Search</Link>
          <Link to="/explore">Explore</Link>
          <Link to="/messages">Messages</Link>
          <Link to="/notifications">Notifications</Link>
          <Link to="/create">Create</Link>
        </nav>

        <p>© 2024 ICHgram</p>
      </footer>
    </main>
  );
};

export default NotFound;
