import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../../context/AuthContext";
import API_URL, { getImageUrl } from "../../api";
import "./Messages.css";

const getId = (value) => {
  if (!value) return "";
  return String(typeof value === "object" ? value._id || value.id : value);
};

const getInitial = (name) => {
  return name?.charAt(0)?.toUpperCase() || "?";
};

const formatShortDate = (date) => {
  if (!date) return "";

  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return "now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} d`;

  return `${Math.floor(seconds / 604800)} wk`;
};

const formatMessageDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Messages = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { id: chatUserId } = useParams();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const selectedUserRef = useRef(null);
  const currentUserId = getId(user);

  selectedUserRef.current = selectedUser;

  const authHeaders = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const fetchConversations = async () => {
    try {
      const response = await fetch(`${API_URL}/api/messages/conversations`, {
        headers: authHeaders,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load conversations");
      }

      setConversations(data.conversations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingConversations(false);
    }
  };

  const markAsRead = async (personId) => {
    try {
      await fetch(`${API_URL}/api/messages/${personId}/read`, {
        method: "PUT",
        headers: authHeaders,
      });

      setConversations((previous) =>
        previous.map((conversation) =>
          getId(conversation.user) === personId
            ? { ...conversation, unreadCount: 0 }
            : conversation,
        ),
      );
    } catch (err) {
      console.error("Mark as read error:", err);
    }
  };

  const fetchMessages = async (person) => {
    if (!person?._id) return;

    setLoadingMessages(true);
    setError("");
    setMessages([]);

    try {
      const response = await fetch(`${API_URL}/api/messages/${person._id}`, {
        headers: authHeaders,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load messages");
      }

      setMessages(data.messages || []);

      await markAsRead(person._id);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token]);

  useEffect(() => {
    if (!chatUserId || !token) return;

    let cancelled = false;

    const openChat = async () => {
      try {
        setError("");

        const existingConversation = conversations.find(
          (conversation) => getId(conversation.user) === chatUserId,
        );

        if (existingConversation?.user) {
          setSelectedUser(existingConversation.user);
          return;
        }

        const response = await fetch(`${API_URL}/api/users/${chatUserId}`);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "User not found");
        }

        if (!cancelled) {
          setSelectedUser(data.user || data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      }
    };

    openChat();

    return () => {
      cancelled = true;
    };
  }, [chatUserId, token, conversations]);

  useEffect(() => {
    if (!token) return;

    const socket = io(API_URL, {
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Messages socket connected");
    });

    socket.on("connect_error", (err) => {
      console.error("Messages socket error:", err.message);
    });

    socket.on("new-message", (message) => {
      const senderId = getId(message.sender);
      const receiverId = getId(message.receiver);

      const otherUserId = senderId === currentUserId ? receiverId : senderId;

      const activeUser = selectedUserRef.current;
      const isCurrentConversation = getId(activeUser) === otherUserId;

      if (isCurrentConversation && senderId !== currentUserId) {
        setMessages((previous) => {
          if (previous.some((item) => item._id === message._id)) {
            return previous;
          }

          return [...previous, message];
        });

        markAsRead(otherUserId);
      }

      setConversations((previous) => {
        const updated = previous.map((conversation) => {
          if (getId(conversation.user) !== otherUserId) {
            return conversation;
          }

          return {
            ...conversation,
            lastMessage: message,
            unreadCount: isCurrentConversation
              ? 0
              : (conversation.unreadCount || 0) + 1,
          };
        });

        return updated.sort((a, b) => {
          const dateA = a.lastMessage
            ? new Date(a.lastMessage.createdAt).getTime()
            : 0;

          const dateB = b.lastMessage
            ? new Date(b.lastMessage.createdAt).getTime()
            : 0;

          return dateB - dateA;
        });
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, currentUserId]);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser);
    }
  }, [selectedUser?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const selectConversation = (person) => {
    setSelectedUser(person);
  };

  const handleSendMessage = async (event) => {
    event.preventDefault();

    const text = newMessage.trim();

    if (!text || !selectedUser || sending) return;

    setSending(true);
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/messages/${selectedUser._id}`,
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ text }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send message");
      }

      const sentMessage = data.data;

      if (!sentMessage || !sentMessage._id) {
        throw new Error("Server did not return the sent message");
      }

      setMessages((previous) => {
        if (previous.some((item) => item._id === sentMessage._id)) {
          return previous;
        }

        return [...previous, sentMessage];
      });

      setNewMessage("");

      setConversations((previous) => {
        const updated = previous.map((conversation) =>
          getId(conversation.user) === getId(selectedUser)
            ? {
                ...conversation,
                lastMessage: sentMessage,
                unreadCount: 0,
              }
            : conversation,
        );

        return updated.sort((a, b) => {
          const dateA = a.lastMessage
            ? new Date(a.lastMessage.createdAt).getTime()
            : 0;

          const dateB = b.lastMessage
            ? new Date(b.lastMessage.createdAt).getTime()
            : 0;

          return dateB - dateA;
        });
      });

      fetchConversations();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const openProfile = () => {
    if (selectedUser?._id) {
      navigate(`/profile/${selectedUser._id}`);
    }
  };

  return (
    <main className="messages-page">
      <aside className="messages-list">
        <div className="messages-list-header">
          <h2>{user?.username || "Messages"}</h2>
        </div>

        <div className="messages-list-content">
          {loadingConversations && <p className="messages-info">Loading...</p>}

          {!loadingConversations && conversations.length === 0 && (
            <p className="messages-info">
              You don't have any conversations yet.
            </p>
          )}

          {conversations.map((conversation) => {
            const person = conversation.user;

            if (!person) return null;

            const isActive = getId(selectedUser) === getId(person);

            const lastMessage = conversation.lastMessage;

            return (
              <button
                type="button"
                className={`conversation-item ${isActive ? "active" : ""}`}
                key={person._id}
                onClick={() => selectConversation(person)}
              >
                <div className="conversation-avatar">
                  {person.avatar ? (
                    <img
                      src={getImageUrl(person.avatar)}
                      alt={person.username}
                    />
                  ) : (
                    <span>{getInitial(person.username)}</span>
                  )}
                </div>

                <div className="conversation-details">
                  <div className="conversation-top">
                    <span className="conversation-name">{person.username}</span>

                    {lastMessage?.createdAt && (
                      <span className="conversation-date">
                        {formatShortDate(lastMessage.createdAt)}
                      </span>
                    )}
                  </div>

                  <div className="conversation-bottom">
                    <span className="conversation-preview">
                      {lastMessage ? lastMessage.text : "Start a conversation"}
                    </span>

                    {conversation.unreadCount > 0 && (
                      <span className="unread-count">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="messages-chat">
        {selectedUser ? (
          <>
            <header className="chat-header">
              <div className="chat-header-avatar">
                {selectedUser.avatar ? (
                  <img
                    src={getImageUrl(selectedUser.avatar)}
                    alt={selectedUser.username}
                  />
                ) : (
                  <span>{getInitial(selectedUser.username)}</span>
                )}
              </div>

              <span className="chat-header-name">{selectedUser.username}</span>
            </header>

            <div className="chat-content">
              <div className="chat-profile">
                <div className="chat-profile-avatar">
                  {selectedUser.avatar ? (
                    <img
                      src={getImageUrl(selectedUser.avatar)}
                      alt={selectedUser.username}
                    />
                  ) : (
                    <span>{getInitial(selectedUser.username)}</span>
                  )}
                </div>

                <h3>{selectedUser.username}</h3>

                <p>{selectedUser.username} · ICHgram</p>

                <button type="button" onClick={openProfile}>
                  View profile
                </button>
              </div>

              {loadingMessages && (
                <p className="messages-info">Loading messages...</p>
              )}

              {!loadingMessages && messages.length === 0 && (
                <p className="empty-chat">
                  Start a conversation with {selectedUser.username}
                </p>
              )}

              <div className="chat-messages">
                {messages.map((message) => {
                  const senderId = getId(message.sender);
                  const isMine = senderId === currentUserId;

                  return (
                    <div
                      className={`message-row ${isMine ? "my-message-row" : "other-message-row"}`}
                      key={message._id}
                    >
                      {!isMine && (
                        <div className="message-avatar">
                          {selectedUser.avatar ? (
                            <img
                              src={getImageUrl(selectedUser.avatar)}
                              alt=""
                            />
                          ) : (
                            <span>{getInitial(selectedUser.username)}</span>
                          )}
                        </div>
                      )}

                      <div
                        className={`message-bubble ${isMine ? "my-message" : "other-message"}`}
                        title={formatMessageDate(message.createdAt)}
                      >
                        {message.text}
                      </div>

                      {isMine && (
                        <div className="message-avatar own-avatar">
                          {user?.avatar ? (
                            <img src={getImageUrl(user.avatar)} alt="" />
                          ) : (
                            <span>{getInitial(user?.username)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>
            </div>

            <form className="chat-input-form" onSubmit={handleSendMessage}>
              <input
                type="text"
                placeholder="Write message"
                value={newMessage}
                onChange={(event) => setNewMessage(event.target.value)}
                maxLength={5000}
              />

              <button type="submit" disabled={!newMessage.trim() || sending}>
                {sending ? "..." : "Send"}
              </button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="no-chat-icon">✉</div>
            <h2>Your messages</h2>
            <p>Select a conversation to start chatting.</p>
          </div>
        )}

        {error && <div className="messages-error">{error}</div>}
      </section>
    </main>
  );
};

export default Messages;
