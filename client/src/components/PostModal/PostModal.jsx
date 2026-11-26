import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_URL, { getImageUrl } from '../../api';
import './PostModal.css';

const PostModal = ({ post, onClose, onDelete, onUpdate, isOwnPost }) => {
    const { user, token } = useAuth();
    const [likes, setLikes] = useState([]);
    const [likesCount, setLikesCount] = useState(0);
    const [liked, setLiked] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [editing, setEditing] = useState(false);
    const [caption, setCaption] = useState(post.caption || '');
    const [newImage, setNewImage] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const apiBase = String(API_URL).replace(/\/$/, '');

    const currentUserId = String(user?._id || user?.id || '');


    useEffect(() => {
        const loadPostData = async () => {
            try {
                setLoading(true);

                const [likesResponse, commentsResponse] = await Promise.all([
                    fetch(`${apiBase}/api/likes/${post._id}`),
                    fetch(`${apiBase}/api/comments/${post._id}`)
                ]);

                const likesData = await likesResponse.json();
                const commentsData = await commentsResponse.json();

                if (likesResponse.ok) {
                    const loadedLikes = likesData.likes || [];

                    setLikes(loadedLikes);
                    setLikesCount(likesData.count ?? loadedLikes.length);

                    setLiked(
                        loadedLikes.some((like) => {
                            const likeUser = like.user;
                            const likeUserId =
                                likeUser?._id || likeUser?.id || likeUser;

                            return String(likeUserId) === currentUserId;
                        })
                    );
                }

                if (commentsResponse.ok) {
                    setComments(commentsData.comments || []);
                }
            } catch (err) {
                console.error('Post loading error:', err);
            } finally {
                setLoading(false);
            }
        };

        loadPostData();
    }, [post._id, apiBase, currentUserId]);


    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden';

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [onClose]);


    const formatCommentDate = (date) => {
        if (!date) return '';

        const seconds = Math.floor(
            (Date.now() - new Date(date).getTime()) / 1000
        );

        if (seconds < 0) return 'just now';
        if (seconds < 60) return 'just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} min.`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} h.`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} d.`;

        return new Date(date).toLocaleDateString();
    };


    const getCommentUserId = (comment) => {
        const commentUser = comment.user;

        return String(
            commentUser?._id ||
            commentUser?.id ||
            commentUser ||
            ''
        );
    };


    const handleLike = async () => {
        if (!token) return;

        try {
            const response = await fetch(
                `${apiBase}/api/likes/${post._id}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to like post');
            }

            setLiked(Boolean(data.liked));

            if (typeof data.likesCount === 'number') {
                setLikesCount(data.likesCount);
            } else {
                setLikesCount((previous) =>
                    Math.max(0, previous + (data.liked ? 1 : -1))
                );
            }
        } catch (err) {
            console.error('Like error:', err);
        }
    };


    const handleComment = async (event) => {
        event.preventDefault();

        const text = commentText.trim();

        if (!text || sending || !token) return;

        try {
            setSending(true);
            setError('');

            const response = await fetch(
                `${apiBase}/api/comments/${post._id}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ text })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to add comment');
            }

            if (data.comment) {
                setComments((previous) => [
                    ...previous,
                    data.comment
                ]);
            }

            setCommentText('');
        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    };


    const handleDeleteComment = async (commentId) => {
        if (!window.confirm('Delete this comment?')) return;

        try {
            const response = await fetch(
                `${apiBase}/api/comments/${commentId}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete comment');
            }

            setComments((previous) =>
                previous.filter((comment) => comment._id !== commentId)
            );
        } catch (err) {
            setError(err.message);
        }
    };


    const handleCommentLike = async (comment) => {
        if (!token) return;

        try {
            const response = await fetch(
                `${apiBase}/api/comments/${comment._id}/like`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to like comment');
            }

            setComments((previous) =>
                previous.map((item) => {
                    if (item._id !== comment._id) return item;

                    const currentLikes = item.likes || [];

                    const updatedLikes = data.liked
                        ? [
                            ...currentLikes.filter((like) =>
                                String(like?._id || like) !== currentUserId
                            ),
                            { _id: currentUserId }
                        ]
                        : currentLikes.filter((like) =>
                            String(like?._id || like) !== currentUserId
                        );

                    return {
                        ...item,
                        likes: updatedLikes,
                        likesCount: data.likesCount
                    };
                })
            );
        } catch (err) {
            console.error('Comment like error:', err);
        }
    };

    const handleSaveEdit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setError('');

            const formData = new FormData();
            formData.append('caption', caption);

            if (newImage) {
                formData.append('image', newImage);
            }

            const response = await fetch(
                `${apiBase}/api/posts/${post._id}`,
                {
                    method: 'PUT',
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to update post');
            }

            if (data.post) {
                onUpdate(data.post);
            }

            setEditing(false);
            setNewImage(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };


    const handleDeletePost = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this post?'
        );

        if (!confirmed) return;

        try {
            const response = await fetch(
                `${apiBase}/api/posts/${post._id}`,
                {
                    method: 'DELETE',
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to delete post');
            }

            onDelete(post._id);
        } catch (err) {
            setError(err.message);
        }
    };

    const postUsername =
        post.user?.username || post.username || 'User';

    const postAvatar =
        post.user?.avatar || post.avatar;

    return (
        <div
            className="post-modal-overlay"
            onClick={onClose}
        >
            <button
                type="button"
                className="post-modal-close"
                onClick={onClose}
                aria-label="Close"
            >
                ×
            </button>

            <section
                className="post-modal"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="post-modal-image">
                    <img
                        src={getImageUrl(post.image)}
                        alt={post.caption || 'Post'}
                    />
                </div>

                <div className="post-modal-content">


                    <header className="post-modal-header">
                        <div className="post-modal-user">
                            {postAvatar ? (
                                <img
                                    src={getImageUrl(postAvatar)}
                                    alt=""
                                />
                            ) : (
                                <div className="post-modal-avatar-placeholder">
                                    {postUsername.charAt(0).toUpperCase()}
                                </div>
                            )}

                            <strong>{postUsername}</strong>
                        </div>

                        {isOwnPost && (
                            <div className="post-modal-menu-wrapper">
                                <button
                                    type="button"
                                    className="post-modal-dots"
                                    onClick={() => setShowMenu(!showMenu)}
                                >
                                    ⋯
                                </button>

                                {showMenu && (
                                    <div className="post-modal-menu">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowMenu(false);
                                                setEditing(true);
                                            }}
                                        >
                                            Edit post
                                        </button>

                                        <button
                                            type="button"
                                            className="delete-option"
                                            onClick={handleDeletePost}
                                        >
                                            Delete post
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </header>

                    {editing ? (
                        <form
                            className="post-modal-edit"
                            onSubmit={handleSaveEdit}
                        >
                            <h3>Edit publication</h3>

                            <textarea
                                value={caption}
                                onChange={(event) =>
                                    setCaption(event.target.value)
                                }
                                maxLength={2200}
                                placeholder="Write a caption..."
                            />

                            <label className="post-modal-file">
                                Change photo

                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(event) =>
                                        setNewImage(
                                            event.target.files?.[0] || null
                                        )
                                    }
                                />
                            </label>

                            {newImage && <p>{newImage.name}</p>}

                            <div className="post-modal-edit-buttons">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditing(false);
                                        setNewImage(null);
                                        setCaption(post.caption || '');
                                    }}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Save'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>

                            <div className="post-modal-comments">


                                {post.caption && (
                                    <div className="post-modal-caption">
                                        <strong>{postUsername}</strong>
                                        <span>{post.caption}</span>
                                    </div>
                                )}

                                {loading ? (
                                    <p className="post-modal-info">
                                        Loading comments...
                                    </p>
                                ) : comments.length > 0 ? (
                                    comments.map((comment) => {
                                        const commentUser = comment.user || {};

                                        const commentUsername =
                                            commentUser.username || 'User';

                                        const commentAvatar =
                                            commentUser.avatar;

                                        const commentLikes =
                                            comment.likes || [];

                                        const isCommentLiked =
                                            commentLikes.some((like) => {
                                                const likeId =
                                                    like?._id || like?.id || like;

                                                return String(likeId) === currentUserId;
                                            });

                                        const canDelete =
                                            getCommentUserId(comment) === currentUserId;

                                        const commentLikesCount =
                                            comment.likesCount ?? commentLikes.length;

                                        return (
                                            <div
                                                className="post-modal-comment"
                                                key={comment._id}
                                            >
                                                <div className="post-modal-comment-avatar">
                                                    {commentAvatar ? (
                                                        <img
                                                            src={getImageUrl(commentAvatar)}
                                                            alt={commentUsername}
                                                        />
                                                    ) : (
                                                        <div className="post-modal-comment-placeholder">
                                                            {commentUsername
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="post-modal-comment-main">
                                                    <div className="post-modal-comment-text">
                                                        <strong>
                                                            {commentUsername}
                                                        </strong>

                                                        <span>
                                                            {comment.text}
                                                        </span>
                                                    </div>

                                                    <div className="post-modal-comment-meta">
                                                        <span>
                                                            {formatCommentDate(comment.createdAt)}
                                                        </span>

                                                        <span>
                                                            {commentLikesCount} likes
                                                        </span>

            
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    className={`post-modal-comment-like ${
                                                        isCommentLiked ? 'liked' : ''
                                                    }`}
                                                    onClick={() =>
                                                        handleCommentLike(comment)
                                                    }
                                                    aria-label="Like comment"
                                                >
                                                    {isCommentLiked ? '♥' : '♡'}
                                                </button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="post-modal-info">
                                        No comments yet.
                                    </p>
                                )}
                            </div>

                            <div className="post-modal-actions">
                                <div className="post-modal-action-buttons">
                                    <button
                                        type="button"
                                        className={liked ? 'liked' : ''}
                                        onClick={handleLike}
                                    >
                                        {liked ? '♥' : '♡'}
                                    </button>

                                    <span>{likesCount} likes</span>
                                </div>

                                <form
                                    className="post-modal-comment-form"
                                    onSubmit={handleComment}
                                >
                                    <input
                                        type="text"
                                        value={commentText}
                                        onChange={(event) =>
                                            setCommentText(event.target.value)
                                        }
                                        placeholder="Add a comment..."
                                        maxLength={1000}
                                    />

                                    <button
                                        type="submit"
                                        disabled={!commentText.trim() || sending}
                                    >
                                        {sending ? '...' : 'Post'}
                                    </button>
                                </form>
                            </div>
                        </>
                    )}

                    {error && (
                        <p className="post-modal-error">
                            {error}
                        </p>
                    )}
                </div>
            </section>
        </div>
    );
};

export default PostModal;
