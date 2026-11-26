import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import API_URL from "../../api";
import "./FollowButton.css";

const FollowButton = ({ userId, onFollowChange }) => {
  const { token, user } = useAuth();

  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentUserId = user?.id || user?._id;

  const isOwnProfile = String(currentUserId) === String(userId);

  useEffect(() => {
    if (!token || !userId || isOwnProfile) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const checkFollow = async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `${API_URL}/api/follows/${userId}/status`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Follow status error");
        }

        if (!cancelled) {
          setFollowing(Boolean(data.following));
        }
      } catch (error) {
        console.error("Follow status error:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    checkFollow();

    return () => {
      cancelled = true;
    };
  }, [userId, token, isOwnProfile]);

  const handleFollow = async () => {
    if (!token || loading || !userId) return;

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/follows/${userId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Follow error");
      }

      const newFollowing = Boolean(data.following);

      setFollowing(newFollowing);

      if (onFollowChange) {
        onFollowChange(newFollowing);
      }
    } catch (error) {
      console.error("Follow error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (isOwnProfile || !userId) return null;

  return (
    <button
      type="button"
      className={`follow-button ${following ? "following" : ""}`}
      onClick={handleFollow}
      disabled={loading}
    >
      {loading ? "..." : following ? "Following" : "Follow"}
    </button>
  );
};

export default FollowButton;
