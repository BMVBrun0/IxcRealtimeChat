"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent
} from "react";
import {
  ArrowLeft,
  BellRing,
  LogOut,
  Pencil,
  Search,
  SendHorizontal,
  SmilePlus,
  UserRound,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Socket } from "socket.io-client";
import { api, ApiError } from "@/lib/api";
import { removeTokenCookie, getCookie } from "@/lib/cookies";
import {
  formatConversationTime,
  formatMessageTime,
  formatPresenceTime,
  shortenMessage,
  splitMessageLinks
} from "@/lib/format";
import { createChatSocket } from "@/lib/socket";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { ChatMessage, PresencePayload, ToastItem, UserSummary } from "@/types";
import { Avatar } from "../ui/Avatar";
import styles from "./ChatClient.module.css";

type MessageMap = Record<string, ChatMessage[]>;

const buildConversationId = (currentUserId: string, message: ChatMessage) => {
  return message.sender.id === currentUserId ? message.receiver.id : message.sender.id;
};

const createToastId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const quickEmojis = ["😀", "😂", "😍", "🤝", "👏", "🎉", "👍", "🙏", "🔥", "❤️"];

const requestNotificationPermission = async () => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission === "default") {
    await Notification.requestPermission().catch(() => undefined);
  }
};

const sortUsers = (input: UserSummary[]) => {
  return [...input].sort((left, right) => {
    const leftTime = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0;
    const rightTime = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0;

    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    if (left.status !== right.status) {
      return left.status === "online" ? -1 : 1;
    }

    return left.name.localeCompare(right.name, "pt-BR");
  });
};

const buildUnreadMap = (input: UserSummary[]) => {
  return Object.fromEntries(
    input
      .filter((user) => (user.unreadCount ?? 0) > 0)
      .map((user) => [user.id, user.unreadCount ?? 0])
  ) as Record<string, number>;
};

export const ChatClient = () => {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const messageListRef = useRef<HTMLDivElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const bootNotificationsShownRef = useRef(false);

  const [currentUser, setCurrentUser] = useState<UserSummary | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [search, setSearch] = useState("");
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageMap>({});
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [unreadMap, setUnreadMap] = useState<Record<string, number>>({});
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<"list" | "chat">("list");
  const [avatarPending, setAvatarPending] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const pushToast = (title: string, description: string, lifetime = 4200) => {
    const toastId = createToastId();

    setToasts((current) => [
      ...current,
      {
        id: toastId,
        title,
        description
      }
    ]);

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toastId));
    }, lifetime);
  };

  const maybeNotifyBrowser = (title: string, body: string, icon?: string | null) => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (Notification.permission !== "granted") {
      return;
    }

    const notification = new Notification(title, {
      body,
      icon: icon ?? "/favicon.ico"
    });

    window.setTimeout(() => notification.close?.(), 5000);
  };

  const unreadTotal = useMemo(
    () => Object.values(unreadMap).reduce((sum, value) => sum + value, 0),
    [unreadMap]
  );

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query)
      );
    });
  }, [search, users]);

  const activeUser = useMemo(
    () => users.find((user) => user.id === activeUserId) ?? null,
    [activeUserId, users]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(max-width: 960px)");
    const sync = () => {
      const mobile = media.matches;
      setIsMobile(mobile);
      setMobilePanel((current) => {
        if (!mobile) {
          return "chat";
        }

        return current;
      });
    };

    sync();
    media.addEventListener("change", sync);

    return () => {
      media.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const bootstrap = async () => {
      const token = getCookie(AUTH_COOKIE_NAME);

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const [me, contactList] = await Promise.all([api.me(), api.users()]);

        if (!mounted) {
          return;
        }

        const mobile = typeof window !== "undefined" && window.matchMedia("(max-width: 960px)").matches;
        const sortedContacts = sortUsers(contactList);
        const initialUnread = buildUnreadMap(sortedContacts);

        setCurrentUser(me);
        setUsers(sortedContacts);
        setUnreadMap(initialUnread);
        setActiveUserId((current) => current ?? (mobile ? null : sortedContacts[0]?.id ?? null));
        setProfileFeedback("");
        setError("");

        const pendingConversations = sortedContacts.filter((user) => (user.unreadCount ?? 0) > 0);
        const pendingMessages = pendingConversations.reduce(
          (sum, user) => sum + (user.unreadCount ?? 0),
          0
        );

        if (pendingMessages > 0 && !bootNotificationsShownRef.current) {
          bootNotificationsShownRef.current = true;
          const description =
            pendingConversations.length === 1
              ? `${pendingMessages} nova${pendingMessages > 1 ? "s" : ""} mensagem${pendingMessages > 1 ? "s" : ""} de ${pendingConversations[0]?.name}.`
              : `${pendingMessages} novas mensagens em ${pendingConversations.length} conversas.`;

          pushToast("Mensagens não lidas", description, 5600);
          maybeNotifyBrowser("Mensagens não lidas", description);
        }
      } catch (caughtError) {
        const message =
          caughtError instanceof ApiError ? caughtError.message : "Não foi possível carregar o chat.";
        setError(message);
        if (caughtError instanceof ApiError && caughtError.status === 401) {
          removeTokenCookie();
          router.replace("/login");
          return;
        }
      } finally {
        if (mounted) {
          setPending(false);
        }
      }
    };

    void bootstrap();
    void requestNotificationPermission();

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.title = unreadTotal > 0 ? `(${unreadTotal}) IXC Chat` : "IXC Chat";
  }, [unreadTotal]);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    const token = getCookie(AUTH_COOKIE_NAME);
    if (!token) {
      return;
    }

    const socket = createChatSocket(token);
    socketRef.current = socket;

    const refreshUsers = async () => {
      try {
        const refreshedUsers = sortUsers(await api.users());
        const refreshedUnread = buildUnreadMap(refreshedUsers);

        setUsers(refreshedUsers);
        setUnreadMap((current) => {
          const nextMap = { ...refreshedUnread };

          if (activeUserId && activeUserId in current && (nextMap[activeUserId] ?? 0) === 0) {
            nextMap[activeUserId] = 0;
          }

          return nextMap;
        });

        setActiveUserId((currentActiveUserId) => {
          if (!currentActiveUserId) {
            return currentActiveUserId;
          }

          const stillExists = refreshedUsers.some((user) => user.id === currentActiveUserId);
          if (stillExists) {
            return currentActiveUserId;
          }

          return isMobile ? null : (refreshedUsers[0]?.id ?? null);
        });
      } catch {
        // noop: keep current list if refresh fails
      }
    };

    socket.on("chat:message", (message: ChatMessage) => {
      setMessages((current) => {
        const conversationId = buildConversationId(currentUser.id, message);
        const currentMessages = current[conversationId] ?? [];
        const nextMessages = [...currentMessages.filter((item) => item.id !== message.id), message];

        return {
          ...current,
          [conversationId]: nextMessages
        };
      });

      setUsers((current) => {
        const conversationId = buildConversationId(currentUser.id, message);

        return sortUsers(
          current.map((user) =>
            user.id === conversationId
              ? {
                  ...user,
                  lastMessageSnippet: message.content,
                  lastMessageAt: message.createdAt
                }
              : user
          )
        );
      });

      if (message.sender.id !== currentUser.id) {
        const shouldMarkUnread = activeUserId !== message.sender.id || document.hidden;

        if (shouldMarkUnread) {
          setUnreadMap((current) => ({
            ...current,
            [message.sender.id]: (current[message.sender.id] ?? 0) + 1
          }));

          pushToast(message.sender.name, shortenMessage(message.content, 72));

          if (document.hidden || activeUserId !== message.sender.id) {
            maybeNotifyBrowser(
              message.sender.name,
              shortenMessage(message.content, 110),
              message.sender.avatarUrl
            );
          }
        } else {
          setUnreadMap((current) => ({
            ...current,
            [message.sender.id]: 0
          }));
        }
      }
    });

    socket.on("presence:update", (payload: PresencePayload) => {
      setUsers((current) =>
        sortUsers(
          current.map((user) =>
            user.id === payload.userId
              ? {
                  ...user,
                  status: payload.status,
                  lastSeen: payload.lastSeen
                }
              : user
          )
        )
      );
    });

    socket.on("users:refresh", () => {
      void refreshUsers();
    });

    socket.on("connect_error", () => {
      setError("Não foi possível conectar ao chat em tempo real.");
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [activeUserId, currentUser]);

  useEffect(() => {
    if (!activeUserId || !currentUser || messages[activeUserId]) {
      return;
    }

    let mounted = true;

    const fetchConversation = async () => {
      try {
        const conversation = await api.conversation(activeUserId);
        if (mounted) {
          setMessages((current) => ({
            ...current,
            [activeUserId]: conversation
          }));
          setError("");
        }
      } catch (caughtError) {
        if (mounted) {
          setError(
            caughtError instanceof ApiError
              ? caughtError.message
              : "Não foi possível carregar o histórico."
          );
        }
      }
    };

    void fetchConversation();

    return () => {
      mounted = false;
    };
  }, [activeUserId, currentUser, messages]);

  useEffect(() => {
    if (!activeUserId) {
      return;
    }

    setUnreadMap((current) => ({
      ...current,
      [activeUserId]: 0
    }));

    if (isMobile) {
      setMobilePanel("chat");
    }
  }, [activeUserId, isMobile]);

  useEffect(() => {
    const viewport = messageListRef.current;
    if (!viewport) {
      return;
    }

    viewport.scrollTop = viewport.scrollHeight;
  }, [activeUserId, messages]);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      void 0;
    } finally {
      socketRef.current?.disconnect();
      removeTokenCookie();
      router.replace("/login");
      router.refresh();
    }
  };

  const handleSend = async () => {
    const content = draft.trim();

    if (!activeUserId || !content || !socketRef.current) {
      return;
    }

    setSending(true);
    setError("");

    socketRef.current.emit(
      "chat:send",
      {
        receiverId: activeUserId,
        content
      },
      (result: { success: boolean; message?: string }) => {
        if (!result.success) {
          setError(result.message ?? "Não foi possível enviar a mensagem.");
          setSending(false);
          return;
        }

        setDraft("");
        setEmojiPickerOpen(false);
        setSending(false);
      }
    );
  };

  const handleComposerSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleSend();
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void handleSend();
    }
  };

  const handlePickEmoji = (emoji: string) => {
    setDraft((current) => `${current}${emoji}`);
    setEmojiPickerOpen(false);
  };

  const handleOpenConversation = (userId: string) => {
    setActiveUserId(userId);
    setError("");
    if (isMobile) {
      setMobilePanel("chat");
    }
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = "";

    if (!file) {
      return;
    }

    setAvatarPending(true);
    setProfileFeedback("");

    try {
      const user = await api.updateAvatar(file);
      setCurrentUser(user);
      setProfileFeedback("Foto atualizada com sucesso.");
    } catch (caughtError) {
      setProfileFeedback(
        caughtError instanceof ApiError
          ? caughtError.message
          : "Não foi possível atualizar a foto de perfil."
      );
    } finally {
      setAvatarPending(false);
    }
  };

  if (pending) {
    return (
      <main className={styles.loading}>
        <div className={styles.loadingCard}>Preparando suas conversas...</div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <aside
          className={`${styles.sidebar} ${isMobile && mobilePanel === "chat" ? styles.sidebarHiddenMobile : ""}`}
        >
          <header className={styles.sidebarHeader}>
            <div className={styles.sidebarIdentity}>
              {currentUser ? <Avatar size="md" user={currentUser} /> : null}
              <div>
                <h1 className={styles.sidebarTitle}>Conversas</h1>
              </div>
            </div>

            <div className={styles.sidebarActions}>
              <button
                aria-label="Abrir perfil"
                className={styles.iconButton}
                onClick={() => setProfileOpen(true)}
                type="button"
              >
                <UserRound size={18} />
              </button>
              <button aria-label="Sair" className={styles.iconButton} onClick={handleLogout} type="button">
                <LogOut size={18} />
              </button>
            </div>
          </header>

          <div className={styles.searchWrap}>
            <Search className={styles.searchIcon} size={16} />
            <input
              className={styles.searchField}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome ou usuário"
              value={search}
            />
          </div>

          <div className={styles.notificationsBar}>
            <BellRing size={16} />
            <span>
              {unreadTotal > 0
                ? `${unreadTotal} nova${unreadTotal > 1 ? "s" : ""}`
                : "Tudo em dia"}
            </span>
          </div>

          <div className={styles.userList}>
            {filteredUsers.length === 0 ? (
              <div className={styles.emptyState}>{"Nenhum usuário encontrado."}</div>
            ) : null}

            {filteredUsers.map((user) => {
              const unreadCount = unreadMap[user.id] ?? user.unreadCount ?? 0;

              return (
                <button
                  className={`${styles.userCard} ${activeUserId === user.id ? styles.userCardActive : ""}`}
                  key={user.id}
                  onClick={() => handleOpenConversation(user.id)}
                  type="button"
                >
                  <Avatar size="md" user={user} />

                  <div className={styles.userMeta}>
                    <div className={styles.userLine}>
                      <span className={styles.userName}>{user.name}</span>
                      <span className={styles.userTime}>{formatConversationTime(user.lastMessageAt)}</span>
                    </div>
                    <div className={styles.userLineSecondary}>
                      <span className={styles.userPreview}>
                        {user.lastMessageSnippet ?? `@${user.username}`}
                      </span>
                      {unreadCount > 0 ? (
                        <span className={styles.unreadBadge}>{unreadCount}</span>
                      ) : (
                        <span className={styles.userStatusInline}>
                          <span
                            className={`${styles.dot} ${user.status === "online" ? styles.dotOnline : ""}`}
                          />
                          {user.status === "online" ? "Online" : "Offline"}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section
          className={`${styles.chatArea} ${isMobile && mobilePanel === "list" ? styles.chatHiddenMobile : ""}`}
        >
          <header className={styles.topbar}>
            <div className={styles.activeUser}>
              {isMobile ? (
                <button
                  aria-label="Voltar para a lista"
                  className={styles.iconButton}
                  onClick={() => setMobilePanel("list")}
                  type="button"
                >
                  <ArrowLeft size={18} />
                </button>
              ) : null}

              {activeUser ? (
                <>
                  <Avatar size="md" user={activeUser} />
                  <div className={styles.activeUserText}>
                    <h2 className={styles.activeUserName}>{activeUser.name}</h2>
                    <p className={styles.activeUserInfo}>
                      {activeUser.status === "online" ? "Online agora" : formatPresenceTime(activeUser.lastSeen)}
                    </p>
                  </div>
                </>
              ) : (
                <div className={styles.activeUserText}>
                  <h2 className={styles.activeUserName}>Selecione uma conversa</h2>
                  <p className={styles.activeUserInfo}>Escolha um contato para visualizar o histórico.</p>
                </div>
              )}
            </div>

            {currentUser ? (
              <button className={styles.accountChip} onClick={() => setProfileOpen(true)} type="button">
                <Avatar size="sm" user={currentUser} />
                <span className={styles.accountChipText}>Meu perfil</span>
              </button>
            ) : null}
          </header>

          <div className={styles.messages} ref={messageListRef}>
            {activeUserId ? (
              (messages[activeUserId] ?? []).length > 0 ? (
                (messages[activeUserId] ?? []).map((message) => {
                  const mine = message.sender.id === currentUser?.id;

                  return (
                    <div className={mine ? styles.messageRowMine : styles.messageRowOther} key={message.id}>
                      <article
                        className={`${styles.messageBubble} ${mine ? styles.messageBubbleMine : styles.messageBubbleOther}`}
                      >
                        <div className={styles.messageText}>
                          {splitMessageLinks(message.content).map((part, index) =>
                            part.type === "link" ? (
                              <a
                                className={`${styles.messageLink} ${mine ? styles.messageLinkMine : styles.messageLinkOther}`}
                                href={part.href}
                                key={`${message.id}-${index}`}
                                rel="noreferrer noopener"
                                target="_blank"
                              >
                                {part.value}
                              </a>
                            ) : (
                              <span key={`${message.id}-${index}`}>{part.value}</span>
                            )
                          )}
                        </div>
                        <span className={styles.messageTime}>{formatMessageTime(message.createdAt)}</span>
                      </article>
                    </div>
                  );
                })
              ) : (
                <div className={styles.emptyConversation}>
                  <strong>Conversa vazia</strong>
                  <span>Envie a primeira mensagem para começar.</span>
                </div>
              )
            ) : (
              <div className={styles.emptyConversation}>
                <strong>Nenhuma conversa aberta</strong>
                <span>Escolha um contato para visualizar o histórico.</span>
              </div>
            )}
          </div>

          <footer className={styles.composer}>
            <form className={styles.composerForm} onSubmit={handleComposerSubmit}>
              <div className={styles.composerField}>
                <button
                  aria-label="Abrir emojis"
                  className={styles.composerAction}
                  disabled={!activeUserId || sending}
                  onClick={() => setEmojiPickerOpen((current) => !current)}
                  type="button"
                >
                  <SmilePlus size={18} />
                </button>
                <input
                  className={styles.composerInput}
                  disabled={!activeUserId || sending}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    if (error) {
                      setError("");
                    }
                  }}
                  onFocus={() => setEmojiPickerOpen(false)}
                  onKeyDown={handleComposerKeyDown}
                  placeholder={activeUser ? `Mensagem para ${activeUser.name}` : "Escolha um contato para conversar"}
                  type="text"
                  value={draft}
                />
                <button
                  aria-label="Enviar mensagem"
                  className={styles.sendButton}
                  disabled={!activeUserId || !draft.trim() || sending}
                  type="submit"
                >
                  <SendHorizontal size={18} />
                </button>
                {emojiPickerOpen ? (
                  <div className={styles.emojiPicker}>
                    {quickEmojis.map((emoji) => (
                      <button
                        className={styles.emojiButton}
                        key={emoji}
                        onClick={() => handlePickEmoji(emoji)}
                        type="button"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              {error ? <p className={styles.composerError}>{error}</p> : null}
            </form>
          </footer>
        </section>
      </section>

      {profileOpen && currentUser ? (
        <div className={styles.modalOverlay} onClick={() => setProfileOpen(false)} role="presentation">
          <article className={styles.profileModal} onClick={(event) => event.stopPropagation()}>
            <header className={styles.profileHeader}>
              <div>
                <h3 className={styles.profileTitle}>Seu perfil</h3>
                <p className={styles.profileSubtitle}>Atualize sua foto e confira os dados da conta.</p>
              </div>

              <button
                aria-label="Fechar perfil"
                className={styles.iconButton}
                onClick={() => setProfileOpen(false)}
                type="button"
              >
                <X size={18} />
              </button>
            </header>

            <div className={styles.profileBody}>
              <div className={styles.profileAvatarWrap}>
                <button
                  aria-label="Trocar foto de perfil"
                  className={styles.profileAvatarButton}
                  disabled={avatarPending}
                  onClick={() => avatarInputRef.current?.click()}
                  type="button"
                >
                  <Avatar size="lg" user={currentUser} />
                  <span className={styles.profileAvatarEdit}>
                    <Pencil size={16} />
                  </span>
                </button>

                <input
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className={styles.hiddenInput}
                  disabled={avatarPending}
                  onChange={handleAvatarUpload}
                  ref={avatarInputRef}
                  type="file"
                />
                {profileFeedback ? <p className={styles.profileFeedback}>{profileFeedback}</p> : null}
              </div>

              <div className={styles.profileData}>
                <div className={styles.profileField}>
                  <span className={styles.profileFieldLabel}>Nome</span>
                  <strong>{currentUser.name}</strong>
                </div>
                <div className={styles.profileField}>
                  <span className={styles.profileFieldLabel}>Usuário</span>
                  <strong>@{currentUser.username}</strong>
                </div>
              </div>
            </div>
          </article>
        </div>
      ) : null}

      <div className={styles.toasts}>
        {toasts.map((toast) => (
          <article className={styles.toast} key={toast.id}>
            <p className={styles.toastTitle}>{toast.title}</p>
            <p className={styles.toastDescription}>{toast.description}</p>
          </article>
        ))}
      </div>
    </main>
  );
};
