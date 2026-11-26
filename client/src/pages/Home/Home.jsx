import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import PostCard from "../../components/PostCard/PostCard";
import API_URL from "../../api";
import allUpdatesIcon from "../../assets/all-updates.svg";
import "./Home.css";

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPosts = useCallback(async () => {
    try {
      setError("");

      const response = await fetch(`${API_URL}/api/posts`);

      if (!response.ok) {
        throw new Error("Не удалось загрузить публикации");
      }

      const data = await response.json();

      setPosts(Array.isArray(data) ? data : data.posts || []);
    } catch (error) {
      console.error("Ошибка загрузки публикаций:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();

    const handlePostCreated = () => {
      loadPosts();
    };

    window.addEventListener("postCreated", handlePostCreated);

    return () => {
      window.removeEventListener("postCreated", handlePostCreated);
    };
  }, [loadPosts]);

  return (
    <div className="home">
      <Sidebar />

      <main className="home-content">
        <div className="home-feed">
          {loading && <p>Загрузка публикаций...</p>}

          {error && <p>{error}</p>}

          {!loading && !error && posts.length === 0 && (
            <p>Пока нет публикаций. Будь первым!</p>
          )}

          {!loading &&
            !error &&
            posts.map((post) => <PostCard key={post._id} post={post} />)}
        </div>

        {!loading && !error && (
          <footer className="home-footer">
            <div className="home-footer-divider">
              <span></span>
              <span></span>
            </div>

            <div className="home-footer-complete">
              <img
                src={allUpdatesIcon}
                alt="All updates viewed"
                className="home-footer-icon"
              />

              <p className="home-footer-title">You've seen all the updates</p>

              <p className="home-footer-subtitle">
                You have viewed all new publications
              </p>
            </div>

            <nav className="home-footer-nav">
              <Link to="/">Home</Link>
              <Link to="/search">Search</Link>
              <Link to="/explore">Explore</Link>
              <Link to="/messages">Messages</Link>
              <Link to="/notifications">Notifications</Link>
              <Link to="/create">Create</Link>
            </nav>

            <p className="home-footer-copyright">© 2024 ICHgram</p>
          </footer>
        )}
      </main>
    </div>
  );
};

export default Home;
