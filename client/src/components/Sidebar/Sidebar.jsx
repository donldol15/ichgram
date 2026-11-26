import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useState, useRef, useEffect } from "react";
import API_URL from "../../api";
import logo from "../../assets/logo.svg";
import homeIcon from "../../assets/Home.svg";
import searchIcon from "../../assets/Search.svg";
import exploreIcon from "../../assets/Explore.svg";
import messagesIcon from "../../assets/Messages.svg";
import notificationsIcon from "../../assets/Notifications.svg";
import createIcon from "../../assets/Create.svg";
import "./Sidebar.css";

const Sidebar = () => {
  const { logout, token, user } = useAuth();
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  const fileInputRef = useRef(null);

  const items = [
    { name: "Search", icon: searchIcon },
    { name: "Explore", icon: exploreIcon },
    { name: "Messages", icon: messagesIcon },
    { name: "Notifications", icon: notificationsIcon },
    { name: "Create", icon: createIcon },
  ];

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  const togglePanel = (name) => {
    setActivePanel((current) => {
      const nextPanel = current === name ? null : name;

      if (nextPanel === "Search") {
        setSearchQuery("");
        setSearchError("");
      }

      setError("");
      return nextPanel;
    });
  };

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;

    if (avatar.startsWith("http")) {
      return avatar;
    }

    return `${API_URL}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
  };

  const getPostImageUrl = (image) => {
    if (!image) return "";

    if (image.startsWith("http")) {
      return image;
    }

    return `${API_URL}${image.startsWith("/") ? "" : "/"}${image}`;
  };

  useEffect(() => {
    if (activePanel !== "Search") return;

    let cancelled = false;

    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        setSearchError("");

        const response = await fetch(`${API_URL}/api/search/users`, {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load users");
        }

        if (!cancelled) {
          setUsers(data.users || []);
        }
      } catch (err) {
        if (!cancelled) {
          setSearchError(err.message || "Something went wrong");
        }
      } finally {
        if (!cancelled) {
          setUsersLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [activePanel, token]);

  const filteredUsers = users.filter((person) =>
    person.username?.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  const openUserProfile = (userId) => {
    setActivePanel(null);
    navigate(`/profile/${userId}`);
  };

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const fetchNotifications = async () => {
      try {
        setNotificationsLoading(true);
        setNotificationsError("");

        const response = await fetch(`${API_URL}/api/notifications`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load notifications");
        }

        if (!cancelled) {
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        if (!cancelled) {
          setNotificationsError(err.message || "Something went wrong");
        }
      } finally {
        if (!cancelled) {
          setNotificationsLoading(false);
        }
      }
    };

    fetchNotifications();

    return () => {
      cancelled = true;
    };
  }, [token, activePanel]);

  const getNotificationText = (notification) => {
    switch (notification.type) {
      case "follow":
        return "started following you";

      case "like":
        return "liked your post";

      case "comment":
        return `commented: "${notification.message}"`;

      default:
        return "interacted with you";
    }
  };

  const getNotificationTime = (date) => {
    if (!date) return "";

    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;

    return new Date(date).toLocaleDateString();
  };

  const openNotification = async (notification) => {
    if (!notification.isRead) {
      try {
        const response = await fetch(
          `${API_URL}/api/notifications/${notification._id}/read`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!response.ok) {
          throw new Error("Failed to mark notification as read");
        }

        setNotifications((previous) =>
          previous.map((item) =>
            item._id === notification._id ? { ...item, isRead: true } : item,
          ),
        );
      } catch (err) {
        console.error(err);
      }
    }

    setActivePanel(null);

    if (notification.sender?._id) {
      navigate(`/profile/${notification.sender._id}`);
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image.");
      return;
    }

    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  };

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleCreatePost = async (event) => {
    event.preventDefault();

    if (!selectedFile) {
      setError("Please select a photo first.");
      return;
    }

    if (!token) {
      setError("Please log in to create a post.");
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();
      formData.append("image", selectedFile);
      formData.append("caption", caption);

      const response = await fetch(`${API_URL}/api/posts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Post creation failed.");
      }

      window.dispatchEvent(new Event("postCreated"));

      setSelectedFile(null);
      setCaption("");
      setPreview("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      setActivePanel(null);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setUploading(false);
    }
  };

  const avatarUrl = getAvatarUrl(user?.avatar);

  return (
    <>
      {activePanel && (
        <div className="panel-overlay" onClick={() => setActivePanel(null)} />
      )}

      <aside className="sidebar">
        <NavLink
          to="/home"
          className="sidebar-logo"
          onClick={() => setActivePanel(null)}
        >
          <img src={logo} alt="Ichgram" />
        </NavLink>

        <nav className="sidebar-navigation">
          <NavLink
            to="/home"
            className={({ isActive }) =>
              `sidebar-item ${isActive ? "active" : ""}`
            }
            onClick={() => setActivePanel(null)}
          >
            <span className="sidebar-icon">
              <img src={homeIcon} alt="" />
            </span>
            <span>Home</span>
          </NavLink>

          {items.map((item) => (
            <button
              key={item.name}
              type="button"
              className={`sidebar-item sidebar-button ${
                activePanel === item.name ? "active" : ""
              }`}
              onClick={() => {
                if (item.name === "Explore") {
                  setActivePanel(null);
                  navigate("/explore");
                } else if (item.name === "Messages") {
                  setActivePanel(null);
                  navigate("/messages");
                } else {
                  togglePanel(item.name);
                }
              }}
            >
              <span className="sidebar-icon">
                <img src={item.icon} alt="" />

                {item.name === "Notifications" && unreadCount > 0 && (
                  <span className="sidebar-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>

              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        <NavLink
          to="/profile"
          className="sidebar-item sidebar-profile"
          onClick={() => setActivePanel(null)}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="Profile" className="profile-avatar" />
          ) : (
            <span className="profile-placeholder">ICH</span>
          )}

          <span>Profile</span>
        </NavLink>

        <button
          className="sidebar-logout"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          Log out
        </button>
      </aside>

      {activePanel && (
        <section className="side-panel">
          <div className="side-panel-header">
            <h2>{activePanel}</h2>

            <button
              className="panel-close"
              onClick={() => setActivePanel(null)}
            >
              ×
            </button>
          </div>

          {activePanel === "Search" && (
            <div className="panel-content search-panel">
              <input
                className="panel-search-input"
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />

              <h4>{searchQuery ? "Results" : "All users"}</h4>

              {usersLoading && (
                <p className="search-message">Loading users...</p>
              )}

              {searchError && <p className="search-error">{searchError}</p>}

              {!usersLoading && !searchError && (
                <div className="search-users-list">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((person) => {
                      const personAvatar = getAvatarUrl(person.avatar);

                      return (
                        <button
                          key={person._id}
                          type="button"
                          className="search-user-item"
                          onClick={() => openUserProfile(person._id)}
                        >
                          {personAvatar ? (
                            <img
                              src={personAvatar}
                              alt={person.username}
                              className="search-user-avatar"
                            />
                          ) : (
                            <div className="search-user-placeholder">
                              {person.username?.charAt(0).toUpperCase()}
                            </div>
                          )}

                          <div className="search-user-info">
                            <span className="search-user-username">
                              {person.username}
                            </span>

                            {person.bio && (
                              <span className="search-user-bio">
                                {person.bio}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <p className="search-message">
                      {searchQuery ? "No users found." : "No users yet."}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {activePanel === "Notifications" && (
            <div className="panel-content notifications-panel">
              {notificationsLoading && (
                <p className="notification-message">Loading notifications...</p>
              )}

              {notificationsError && (
                <p className="notification-error">{notificationsError}</p>
              )}

              {!notificationsLoading &&
                !notificationsError &&
                notifications.length === 0 && (
                  <p className="notification-message">No notifications yet.</p>
                )}

              {!notificationsLoading &&
                notifications.map((notification) => {
                  const sender = notification.sender;

                  if (!sender) return null;

                  const senderAvatar = getAvatarUrl(sender.avatar);

                  const postImage = getPostImageUrl(notification.post?.image);

                  return (
                    <button
                      key={notification._id}
                      type="button"
                      className={`notification-item ${
                        notification.isRead ? "" : "unread"
                      }`}
                      onClick={() => openNotification(notification)}
                    >
                      {senderAvatar ? (
                        <img
                          src={senderAvatar}
                          alt=""
                          className="notification-avatar"
                        />
                      ) : (
                        <div className="notification-avatar-placeholder">
                          {sender.username?.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="notification-info">
                        <div className="notification-description">
                          <strong>{sender.username}</strong>{" "}
                          {getNotificationText(notification)}
                        </div>

                        <span className="notification-time">
                          {getNotificationTime(notification.createdAt)}
                        </span>
                      </div>

                      {postImage && (
                        <img
                          src={postImage}
                          alt="Post"
                          className="notification-post-image"
                        />
                      )}

                      {!notification.isRead && (
                        <span className="notification-unread-dot" />
                      )}
                    </button>
                  );
                })}
            </div>
          )}

          {activePanel === "Create" && (
            <form
              className="panel-content create-post-form"
              onSubmit={handleCreatePost}
            >
              <p>Create a new post.</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                hidden
              />

              {preview && (
                <img
                  src={preview}
                  alt="Post preview"
                  className="create-post-preview"
                />
              )}

              <button
                type="button"
                className="create-post-button"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? "Choose another photo" : "Select photos"}
              </button>

              {selectedFile && (
                <p className="selected-file-name">{selectedFile.name}</p>
              )}

              <textarea
                className="create-post-caption"
                placeholder="Write a caption..."
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                maxLength={2200}
                rows={4}
              />

              {error && <p className="create-post-error">{error}</p>}

              <button
                type="submit"
                className="create-post-button"
                disabled={uploading || !selectedFile}
              >
                {uploading ? "Sharing..." : "Share"}
              </button>
            </form>
          )}
        </section>
      )}
    </>
  );
};

export default Sidebar;
