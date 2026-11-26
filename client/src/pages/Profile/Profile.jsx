import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FollowButton from '../../components/FollowButton/FollowButton';
import PostModal from '../../components/PostModal/PostModal';
import API_URL from '../../api';
import './Profile.css';

const Profile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token, updateUser } = useAuth();
    const isOwnProfile = !id;
    const [profileUser, setProfileUser] = useState(user);
    const [posts, setPosts] = useState([]);
    const [selectedPost, setSelectedPost] = useState(null);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [username, setUsername] = useState(user?.username || '');
    const [email, setEmail] = useState(user?.email || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [website, setWebsite] = useState(user?.website || '');
    const [selectedFile, setSelectedFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const fileInputRef = useRef(null);
    const apiBase = String(API_URL).replace(/\/$/, '');

    const getImageUrl = (path) => {
        if (!path) return '';

        if (path.startsWith('http')) {
            return path;
        }

        return `${apiBase}${path.startsWith('/') ? path : `/${path}`}`;
    };

    const getPostsArray = (data) => {
        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data?.posts)) {
            return data.posts;
        }

        return [];
    };

    useEffect(() => {
        if (!id) {
            setProfileUser(user);
            return;
        }

        let cancelled = false;

        const loadUserProfile = async () => {
            try {
                setLoadingProfile(true);
                setLoadError('');

                const response = await fetch(
                    `${apiBase}/api/users/${id}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || 'Failed to load profile'
                    );
                }

                if (!cancelled) {
                    setProfileUser(data.user || data);
                    setPosts(getPostsArray(data));
                }
            } catch (err) {
                if (!cancelled) {
                    setLoadError(
                        err.message || 'Failed to load profile'
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoadingProfile(false);
                }
            }
        };

        loadUserProfile();

        return () => {
            cancelled = true;
        };
    }, [id, apiBase, user]);

    useEffect(() => {
        if (!isOwnProfile || !token) return;

        let cancelled = false;

        const loadMyPosts = async () => {
            try {
                const response = await fetch(
                    `${apiBase}/api/posts/my`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data.message || 'Failed to load posts'
                    );
                }

                if (!cancelled) {
                    setPosts(getPostsArray(data));
                }
            } catch (err) {
                if (!cancelled) {
                    console.error('Error loading posts:', err);
                }
            }
        };

        loadMyPosts();

        const handlePostCreated = () => {
            loadMyPosts();
        };

        window.addEventListener('postCreated', handlePostCreated);

        return () => {
            cancelled = true;
            window.removeEventListener(
                'postCreated',
                handlePostCreated
            );
        };
    }, [isOwnProfile, token, apiBase]);

    useEffect(() => {
        if (!isOwnProfile) return;

        setProfileUser(user);
        setUsername(user?.username || '');
        setEmail(user?.email || '');
        setBio(user?.bio || '');
        setWebsite(user?.website || '');
    }, [user, isOwnProfile]);

    useEffect(() => {
        const profileId = isOwnProfile
            ? user?.id || user?._id
            : profileUser?._id;

        if (!profileId) return;

        let cancelled = false;

        const loadFollowCounts = async () => {
            try {
                const [
                    followersResponse,
                    followingResponse
                ] = await Promise.all([
                    fetch(
                        `${apiBase}/api/follows/${profileId}/followers`
                    ),
                    fetch(
                        `${apiBase}/api/follows/${profileId}/following`
                    )
                ]);

                const followersData = await followersResponse.json();
                const followingData = await followingResponse.json();

                if (cancelled) return;

                if (followersResponse.ok) {
                    setFollowersCount(followersData.count ?? 0);
                }

                if (followingResponse.ok) {
                    setFollowingCount(followingData.count ?? 0);
                }
            } catch (error) {
                console.error('Error loading follow counts:', error);
            }
        };

        loadFollowCounts();

        return () => {
            cancelled = true;
        };
    }, [
        isOwnProfile,
        profileUser?._id,
        user?.id,
        user?._id,
        apiBase
    ]);

    useEffect(() => {
        return () => {
            if (preview) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const openEditModal = () => {
        setUsername(user?.username || '');
        setEmail(user?.email || '');
        setBio(user?.bio || '');
        setWebsite(user?.website || '');
        setSelectedFile(null);
        setPreview('');
        setError('');
        setSuccess('');
        setIsEditing(true);
    };

    const closeEditModal = () => {
        if (saving || uploading) return;

        setIsEditing(false);
        setSelectedFile(null);
        setPreview('');
        setError('');
        setSuccess('');
    };

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please select an image.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Image must be smaller than 5 MB.');
            return;
        }

        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));
        setError('');
        setSuccess('');
    };

    const handleAvatarUpload = async () => {
        if (!selectedFile) return;

        try {
            setUploading(true);
            setError('');
            setSuccess('');

            const formData = new FormData();
            formData.append('avatar', selectedFile);

            const response = await fetch(
                `${apiBase}/api/users/avatar`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    body: formData
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Avatar upload failed.'
                );
            }

            if (!data.user) {
                throw new Error(
                    'Server did not return updated user data.'
                );
            }

            updateUser(data.user);
            setProfileUser(data.user);
            setSelectedFile(null);
            setPreview('');
            setSuccess('Profile photo updated successfully.');
        } catch (err) {
            setError(err.message || 'Something went wrong.');
        } finally {
            setUploading(false);
        }
    };

    const handleSaveProfile = async (event) => {
        event.preventDefault();

        if (!username.trim()) {
            setError('Username cannot be empty.');
            return;
        }

        if (!email.trim()) {
            setError('Email cannot be empty.');
            return;
        }

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const response = await fetch(
                `${apiBase}/api/users/profile`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        username: username.trim(),
                        email: email.trim(),
                        bio,
                        website: website.trim()
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || 'Profile update failed.'
                );
            }

            if (!data.user) {
                throw new Error(
                    'Server did not return updated user data.'
                );
            }

            updateUser(data.user);
            setProfileUser(data.user);
            setSuccess('Profile updated successfully.');
            setIsEditing(false);
        } catch (err) {
            setError(err.message || 'Something went wrong.');
        } finally {
            setSaving(false);
        }
    };

    const openMessages = () => {
        const profileId = profileUser?._id || profileUser?.id;

        if (!profileId) {
            console.error('Profile user ID is missing');
            return;
        }

        navigate(`/messages/${profileId}`);
    };

    const handleFollowChange = (isFollowing) => {
        setFollowersCount((prev) =>
            Math.max(0, prev + (isFollowing ? 1 : -1))
        );
    };

    const handlePostUpdate = (updatedPost) => {
        setPosts((prev) =>
            prev.map((post) =>
                post._id === updatedPost._id ? updatedPost : post
            )
        );

        setSelectedPost(updatedPost);
    };

    const handlePostDelete = (postId) => {
        setPosts((prev) =>
            prev.filter((post) => post._id !== postId)
        );

        setSelectedPost(null);
    };

    if (loadingProfile) {
        return (
            <main className="profile-page">
                <p>Loading profile...</p>
            </main>
        );
    }

    if (loadError) {
        return (
            <main className="profile-page">
                <h2>Unable to load profile</h2>
                <p>{loadError}</p>
            </main>
        );
    }

    if (!profileUser) {
        return (
            <main className="profile-page">
                <p>Profile not found.</p>
            </main>
        );
    }

    const displayName = profileUser.username || 'User';
    const avatarUrl = getImageUrl(profileUser.avatar);

    const avatarToShow = isOwnProfile && preview
        ? preview
        : avatarUrl;

    if (isOwnProfile && isEditing) {
        return (
            <main className="edit-profile-page">
                <h1>Edit profile</h1>

                <div className="edit-profile-container">
                    <div className="edit-profile-avatar">
                        {avatarToShow ? (
                            <img src={avatarToShow} alt="Profile" />
                        ) : (
                            <div className="profile-avatar-placeholder">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                        )}

                        <div className="edit-profile-avatar-info">
                            <strong>{displayName}</strong>

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                New photo
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>

                    {selectedFile && (
                        <button
                            type="button"
                            className="edit-profile-upload"
                            onClick={handleAvatarUpload}
                            disabled={uploading}
                        >
                            {uploading ? 'Uploading...' : 'Save new photo'}
                        </button>
                    )}

                    <form
                        className="edit-profile-form"
                        onSubmit={handleSaveProfile}
                    >
                        <label>
                            Username
                            <input
                                type="text"
                                value={username}
                                onChange={(event) =>
                                    setUsername(event.target.value)
                                }
                                maxLength={30}
                            />
                        </label>

                        <label>
                            Website
                            <input
                                type="url"
                                value={website}
                                onChange={(event) =>
                                    setWebsite(event.target.value)
                                }
                                placeholder="Website"
                            />
                        </label>

                        <label>
                            About
                            <textarea
                                value={bio}
                                onChange={(event) =>
                                    setBio(event.target.value)
                                }
                                maxLength={150}
                                placeholder="Write something about yourself..."
                            />

                            <span className="edit-profile-counter">
                                {bio.length}/150
                            </span>
                        </label>

                        {error && (
                            <p className="profile-form-error">
                                {error}
                            </p>
                        )}

                        {success && (
                            <p className="profile-form-success">
                                {success}
                            </p>
                        )}

                        <div className="edit-profile-buttons">
                            <button
                                type="button"
                                onClick={closeEditModal}
                                disabled={saving || uploading}
                                className="edit-profile-cancel"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={saving || uploading}
                                className="edit-profile-save"
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>

                    <footer className="edit-profile-footer">
                        About · Help · Privacy · Terms · © 2024 ICHgram
                    </footer>
                </div>
            </main>
        );
    }

    return (
        <main className="profile-page">
            <section className="profile-header">
                <div className="profile-avatar-container">
                    {avatarToShow ? (
                        <img
                            src={avatarToShow}
                            alt="Profile"
                            className="profile-main-avatar"
                        />
                    ) : (
                        <div className="profile-main-avatar profile-avatar-placeholder">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>

                <div className="profile-details">
                    <div className="profile-top-line">
                        <h1 className="profile-username">
                            {displayName}
                        </h1>

                        <div className="profile-header-buttons">
                            {isOwnProfile ? (
                                <button
                                    className="profile-edit-button"
                                    onClick={openEditModal}>
                                    Edit profile
                                </button>
                            ) : (
                                <>
                                    <FollowButton
                                        userId={profileUser._id}
                                        onFollowChange={handleFollowChange}
                                    />

                                    <button
                                        type="button"
                                        className="profile-message-button"
                                        onClick={openMessages}
                                    >
                                        Message
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="profile-stats">
                        <span>
                            <strong>{posts.length}</strong> posts
                        </span>

                        <span>
                            <strong>{followersCount}</strong> followers
                        </span>

                        <span>
                            <strong>{followingCount}</strong> following
                        </span>
                    </div>

                    <div className="profile-bio">
                        <p>
                            {profileUser.bio || 'No biography yet.'}
                        </p>
                    </div>
                </div>
            </section>

            <div className="profile-divider" />

            <nav className="profile-tabs">
                <span className="profile-tab active">
                    <span className="profile-tab-icon">▦</span>
                    POSTS
                </span>
            </nav>

            <section className="profile-posts">
                {posts.length > 0 ? (
                    posts.map((post) => (
                        <div
                            className="profile-post"
                            key={post._id}
                            onClick={() => setSelectedPost(post)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(event) => {
                                if (
                                    event.key === 'Enter' ||
                                    event.key === ' '
                                ) {
                                    event.preventDefault();
                                    setSelectedPost(post);
                                }
                            }}
                        >
                            <img
                                src={getImageUrl(post.image)}
                                alt={post.caption || 'Post'}
                            />
                        </div>
                    ))
                ) : (
                    <div className="profile-empty">
                        <div className="profile-camera-icon">▧</div>

                        <h2>
                            {isOwnProfile
                                ? 'Share Photos'
                                : 'No Posts Yet'}
                        </h2>

                        <p>
                            {isOwnProfile
                                ? 'When you share photos, they will appear on your profile.'
                                : 'This user has not shared any posts yet.'}
                        </p>
                    </div>
                )}
            </section>

            {selectedPost && (
                <PostModal
                    post={selectedPost}
                    isOwnPost={
                        String(
                            selectedPost.user?._id ||
                            selectedPost.user ||
                            ''
                        ) === String(user?.id || user?._id || '')
                    }
                    onClose={() => setSelectedPost(null)}
                    onUpdate={handlePostUpdate}
                    onDelete={handlePostDelete}
                />
            )}
        </main>
    );
};

export default Profile;
