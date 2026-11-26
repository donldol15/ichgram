import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import API_URL from "../../api";
import "./Explore.css";

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_URL}/api/posts`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load posts");
        }

        if (!cancelled) {
          setPosts(Array.isArray(data) ? data : data.posts || []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Something went wrong");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchPosts();

    return () => {
      cancelled = true;
    };
  }, []);

  const getImageUrl = (image) => {
    if (!image) return "";

    if (image.startsWith("http")) {
      return image;
    }

    return `${API_URL}${image.startsWith("/") ? "" : "/"}${image}`;
  };

  return (
    <div className="explore-page">
      <Sidebar />

      <main className="explore-content">
        {loading && <p className="explore-message">Loading posts...</p>}

        {error && <p className="explore-error">{error}</p>}

        {!loading && !error && posts.length === 0 && (
          <p className="explore-message">No posts yet.</p>
        )}

        {!loading && !error && posts.length > 0 && (
          <div className="explore-grid">
            {posts.map((post) => (
              <div className="explore-post" key={post._id}>
                <img src={getImageUrl(post.image)} alt="Post" loading="lazy" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Explore;
