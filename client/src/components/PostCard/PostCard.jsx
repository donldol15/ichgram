import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getImageUrl } from "../../api";
import API_URL from "../../api";
import FollowButton from "../FollowButton/FollowButton";
import "./PostCard.css";

const getPostDate = (date) => {
  if (!date) return "";

  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w`;

  return `${Math.floor(seconds / 2592000)}mo`;
};

const PostCard = ({ post }) => {
  const { token, user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [likeProcessing, setLikeProcessing] = useState(false);
  const currentUserId = user?.id || user?._id;
  const username = post?.user?.username || "user";
  const avatar = post?.user?.avatar;
  const authorId = post?.user?._id || post?.user;
  const image = getImageUrl(post?.image);

  useEffect(() => {
    if (!post?._id) return;

    const loadLikes = async () => {
      try {
        const response = await fetch(`${API_URL}/api/likes/${post._id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        const data = await response.json();

        if (response.ok) {
          const likes = data.likes || [];

          setLikesCount(data.count ?? likes.length);

          setLiked(
            likes.some(
              (like) =>
                String(like.user?._id || like.user) === String(currentUserId),
            ),
          );
        }
      } catch (error) {
        console.error("Error loading likes:", error);
      }
    };

    loadLikes();
  }, [post?._id, token, currentUserId]);

  useEffect(() => {
    if (!post?._id) return;

    const loadComments = async () => {
      try {
        const response = await fetch(`${API_URL}/api/comments/${post._id}`);

        const data = await response.json();

        if (response.ok) {
          const loadedComments = Array.isArray(data)
            ? data
            : data.comments || [];

          setComments(loadedComments);
          setCommentsCount(loadedComments.length);
        }
      } catch (error) {
        console.error("Error loading comments:", error);
      }
    };

    loadComments();
  }, [post?._id]);

  if (!post) return null;

  const handleLike = async () => {
    if (!token || likeProcessing) return;

    setLikeProcessing(true);

    try {
      const response = await fetch(`${API_URL}/api/likes/${post._id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        setLiked(data.liked ?? !liked);

        if (typeof data.likesCount === "number") {
          setLikesCount(data.likesCount);
        } else {
          setLikesCount((prev) =>
            (data.liked ?? !liked) ? prev + 1 : Math.max(0, prev - 1),
          );
        }
      }
    } catch (error) {
      console.error("Error liking post:", error);
    } finally {
      setLikeProcessing(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    const text = commentText.trim();

    if (!text || !token || commentSending) return;

    setCommentSending(true);

    try {
      const response = await fetch(`${API_URL}/api/comments/${post._id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (response.ok) {
        const newComment = data.comment || data;

        setComments((prev) => [...prev, newComment]);
        setCommentsCount((prev) => prev + 1);
        setCommentText("");
      }
    } catch (error) {
      console.error("Error sending comment:", error);
    } finally {
      setCommentSending(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setComments((prev) =>
          prev.filter((comment) => comment._id !== commentId),
        );

        setCommentsCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const lastComment = comments[comments.length - 1];

  return (
    <article className="post-card">
      <div className="post-header">
        <div className="post-user">
          {avatar ? (
            <img
              src={getImageUrl(avatar)}
              alt={username}
              className="post-avatar"
            />
          ) : (
            <div className="post-avatar-placeholder">
              {username[0]?.toUpperCase()}
            </div>
          )}

          <span className="post-username">{username}</span>

          <FollowButton userId={authorId} />

          <span className="post-dot">·</span>

          <span className="post-date">{getPostDate(post.createdAt)}</span>
        </div>
      </div>

      <div className="post-image">
        <img src={image} alt="Post" />
      </div>

      <div className="post-actions">
        <button
          type="button"
          onClick={handleLike}
          className={liked ? "liked" : ""}
          disabled={likeProcessing}
          aria-label="Like"
        >
          <svg
            viewBox="0 0 24 24"
            width="25"
            height="25"
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => setCommentsOpen((prev) => !prev)}
          aria-label="Comments"
          className="comment-icon-button"
        >
          <svg
            viewBox="0 0 24 24"
            width="25"
            height="25"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8v.5Z" />
          </svg>
        </button>
      </div>

      <div className="post-details">
        <div className="post-likes">{likesCount} likes</div>

        {post.caption && (
          <div className="post-caption">
            <strong>{username}</strong> {post.caption}
          </div>
        )}

        {!commentsOpen && lastComment && (
          <div className="post-comment-preview">
            <strong>{lastComment.user?.username || "user"}</strong>{" "}
            {lastComment.text}
          </div>
        )}

        {commentsOpen && (
          <div className="comments-section">
            {comments.map((comment) => {
              const commentUserId = comment.user?._id || comment.user;

              const isOwner = String(commentUserId) === String(currentUserId);

              return (
                <div className="comment-item" key={comment._id}>
                  {comment.user?.avatar ? (
                    <img
                      src={getImageUrl(comment.user.avatar)}
                      alt=""
                      className="comment-avatar"
                    />
                  ) : (
                    <div className="comment-avatar-placeholder">
                      {comment.user?.username?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}

                  <div className="comment-body">
                    <strong>{comment.user?.username || "user"}</strong>{" "}
                    {comment.text}
                  </div>

                  {isOwner && (
                    <button
                      type="button"
                      className="delete-comment"
                      onClick={() => handleDeleteComment(comment._id)}
                      aria-label="Delete comment"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}

            <form className="comment-form" onSubmit={handleCommentSubmit}>
              <input
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={1000}
              />

              <button
                type="submit"
                disabled={!commentText.trim() || commentSending}
              >
                {commentSending ? "Posting..." : "Post"}
              </button>
            </form>
          </div>
        )}
      </div>
    </article>
  );
};

export default PostCard;
