import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import Swal from "sweetalert2";

const BASE_URL = "http://localhost:8080";

function getUserIdFromToken(token) {
  try {
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userID || null;
  } catch {
    return null;
  }
}

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: true,
});

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "User");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("leafTheme") === "dark");
  const navigate = useNavigate();

  useEffect(() => {
    document.body.className = darkMode ? "theme-dark" : "theme-light";
    localStorage.setItem("leafTheme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleLoginSuccess = (newToken, name) => {
    localStorage.setItem("token", newToken);
    localStorage.setItem("userName", name);
    setToken(newToken);
    setUserName(name);
    navigate("/dashboard");
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Sign out of LeafNote?",
      text: "You will be returned to the sign-in screen.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Sign Out",
    });

    if (!result.isConfirmed) return;

    try {
      await fetch(`${BASE_URL}/user/logout`, {
        headers: { Authorization: token },
      });
    } catch {
      // Ignore network error
    }

    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    setToken("");
    setUserName("");
    Toast.fire({ icon: "info", title: "Signed out" });
    navigate("/login");
  };

  return (
    <Routes>
      <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />

      <Route
        path="/login"
        element={
          token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthPage mode="login" onAuthSuccess={handleLoginSuccess} />
          )
        }
      />

      <Route
        path="/register"
        element={
          token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthPage mode="register" onAuthSuccess={handleLoginSuccess} />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          token ? (
            <Workspace
              token={token}
              userName={userName}
              viewMode="all"
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route
        path="/my-notes"
        element={
          token ? (
            <Workspace
              token={token}
              userName={userName}
              viewMode="mine"
              darkMode={darkMode}
              setDarkMode={setDarkMode}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

/* ==================== AUTH PAGE ==================== */
function AuthPage({ mode, onAuthSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isLogin = mode === "login";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const endpoint = isLogin ? "/user/login" : "/user/register";
    const payload = isLogin ? { email, password } : { name, email, password };

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (isLogin) {
        if (data.token) {
          Swal.fire({
            icon: "success",
            title: "Welcome Back!",
            text: `Signed in as ${data.userName || email}`,
            timer: 1400,
            showConfirmButton: false,
          });
          onAuthSuccess(data.token, data.userName || email.split("@")[0]);
        } else {
          Swal.fire({
            icon: "error",
            title: "Login Failed",
            text: data.msg || "Invalid email or password",
            confirmButtonColor: "#10b981",
          });
        }
      } else {
        if (res.ok && !data.error) {
          await Swal.fire({
            icon: "success",
            title: "Account Created!",
            text: "Your account is ready. Please sign in.",
            confirmButtonColor: "#10b981",
          });
          setPassword("");
          navigate("/login");
        } else {
          Swal.fire({
            icon: "error",
            title: "Registration Failed",
            text: data.msg || "Could not create account",
            confirmButtonColor: "#10b981",
          });
        }
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Server Offline",
        text: "Please start your backend server on port 8080 first.",
        confirmButtonColor: "#10b981",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-brand-panel">
        <div className="brand-pill">Collaborative Notes Workspace</div>
        <h1>LeafNote Studio</h1>
        <p>
          Organize your study material, project checklists, and ideas in one
          place—share knowledge across your team while keeping your personal
          edits protected.
        </p>

        <div className="auth-preview-card">
          <div className="preview-top">
            <span className="dot red" />
            <span className="dot yellow" />
            <span className="dot green" />
            <small>Smart Workspace Access</small>
          </div>
          <p className="preview-code">
            Shared Community Feed • Protected Personal Edits
          </p>
          <span className="preview-caption">
            Read all team notes • Edit &amp; delete only your own
          </span>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-card">
          <h2>{isLogin ? "Welcome back" : "Create your account"}</h2>
          <p className="auth-subtext">
            {isLogin
              ? "Sign in to access shared notes and your personal workspace"
              : "Register now to publish and manage your notes"}
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {!isLogin && (
              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <div className="pass-field">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="pass-toggle"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button type="submit" className="btn-primary btn-full" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="auth-switch">
            {isLogin ? (
              <p>
                New to LeafNote? <Link to="/register">Create an account</Link>
              </p>
            ) : (
              <p>
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==================== WORKSPACE ==================== */
function Workspace({ token, userName, viewMode, darkMode, setDarkMode, onLogout }) {
  const [allNotes, setAllNotes] = useState([]);
  const [myNotes, setMyNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Study");
  const [body, setBody] = useState("");
  const [editingId, setEditingId] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [layout, setLayout] = useState("grid");
  const [showModal, setShowModal] = useState(false);
  const [readingNote, setReadingNote] = useState(null);
  const [pinnedIds, setPinnedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("pinnedNotes") || "[]");
    } catch {
      return [];
    }
  });

  const location = useLocation();
  const currentUserId = getUserIdFromToken(token);

  const loadNotes = async () => {
    try {
      const [allRes, myRes] = await Promise.all([
        fetch(`${BASE_URL}/note/all`, { headers: { Authorization: token } }),
        fetch(`${BASE_URL}/note/read`, { headers: { Authorization: token } }),
      ]);
      const allData = await allRes.json();
      const myData = await myRes.json();
      if (Array.isArray(allData)) setAllNotes(allData);
      if (Array.isArray(myData)) setMyNotes(myData);
    } catch (err) {
      console.error("Failed to fetch notes:", err);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [token, location.pathname]);

  const togglePin = (id) => {
    const next = pinnedIds.includes(id)
      ? pinnedIds.filter((item) => item !== id)
      : [id, ...pinnedIds];
    setPinnedIds(next);
    localStorage.setItem("pinnedNotes", JSON.stringify(next));
    Toast.fire({
      icon: "success",
      title: pinnedIds.includes(id) ? "Note unpinned" : "Pinned to top!",
    });
  };

  const handleCopy = (note) => {
    navigator.clipboard.writeText(`${note.title}\n\n${note.body}`);
    Toast.fire({ icon: "success", title: "Copied to clipboard!" });
  };

  const handleExportTxt = () => {
    const list = viewMode === "mine" ? myNotes : allNotes;
    if (!list.length) {
      Toast.fire({ icon: "info", title: "No notes to export" });
      return;
    }
    const text = list
      .map(
        (n, idx) =>
          `${idx + 1}. [${n.category.toUpperCase()}] ${n.title}\nAccess: ${
            n.userID === currentUserId ? "Owner (Editable)" : "Community (Read-Only)"
          }\nDate: ${n.createdAt ? new Date(n.createdAt).toLocaleString() : "Recent"}\n----------------------------------------\n${n.body}\n\n`
      )
      .join("");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `LeafNote_${viewMode}_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    Toast.fire({ icon: "success", title: "Exported as .TXT!" });
  };

  const applyTemplate = (type) => {
    if (type === "lecture") {
      setCategory("Study");
      setTitle("Lecture Summary: ");
      setBody("• Core Topic:\n• Key Definitions:\n• Exam Questions / Takeaways:");
    } else if (type === "checklist") {
      setCategory("Work");
      setTitle("Sprint Task Checklist");
      setBody("[ ] Design UI Components\n[ ] Test API Endpoints\n[ ] Final Review");
    } else if (type === "idea") {
      setCategory("Ideas");
      setTitle("Project Concept");
      setBody("Problem:\nSolution:\nKey Features:");
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setTitle("");
    setCategory("Study");
    setBody("");
    setShowModal(true);
  };

  const openEdit = (note) => {
    setEditingId(note._id);
    setTitle(note.title);
    setCategory(note.category);
    setBody(note.body);
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const url = editingId
      ? `${BASE_URL}/note/update/${editingId}`
      : `${BASE_URL}/note/create`;
    const method = editingId ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify({ title, category, body }),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingId(null);
        setTitle("");
        setBody("");
        loadNotes();
        Toast.fire({
          icon: "success",
          title: editingId ? "Note updated!" : "Note published!",
        });
      }
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to save note." });
    }
  };

  const handleDelete = async (id) => {
    const resConfirm = await Swal.fire({
      title: "Delete this note?",
      text: "This action will permanently remove the note.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Delete",
    });

    if (!resConfirm.isConfirmed) return;

    try {
      const res = await fetch(`${BASE_URL}/note/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });
      if (res.ok) {
        if (readingNote?._id === id) setReadingNote(null);
        loadNotes();
        Toast.fire({ icon: "success", title: "Note deleted" });
      }
    } catch {
      Swal.fire({ icon: "error", title: "Error", text: "Could not delete note." });
    }
  };

  const sourceNotes = viewMode === "mine" ? myNotes : allNotes;

  const visibleNotes = sourceNotes
    .filter((n) => {
      const matchText =
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.body.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedCategory === "All" ||
        n.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchText && matchCat;
    })
    .sort((a, b) => {
      const aPin = pinnedIds.includes(a._id);
      const bPin = pinnedIds.includes(b._id);
      if (aPin && !bPin) return -1;
      if (!aPin && bPin) return 1;
      if (sortBy === "oldest") return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      if (sortBy === "az") return a.title.localeCompare(b.title);
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  const totalCount = allNotes.length || 1;
  const countByCat = (cat) =>
    allNotes.filter((n) => n.category.toLowerCase() === cat).length;

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="logo-badge">L</div>
          <div>
            <strong>LeafNote</strong>
            <span>STUDIO EDITION</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link
            to="/dashboard"
            className={`nav-link ${viewMode === "all" ? "active" : ""}`}
          >
            <span>All Shared Notes</span>
            <span className="pill-count">{allNotes.length}</span>
          </Link>

          <Link
            to="/my-notes"
            className={`nav-link ${viewMode === "mine" ? "active" : ""}`}
          >
            <span>My Notes Only</span>
            <span className="pill-count">{myNotes.length}</span>
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <button
            type="button"
            className="theme-switch-btn"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "☀ Switch to Light Mode" : "☾ Switch to Dark Mode"}
          </button>

          <div className="profile-box">
            <div className="avatar-circle">{userName.charAt(0).toUpperCase()}</div>
            <div className="profile-info">
              <strong>{userName}</strong>
              <small>Active Workspace</small>
            </div>
          </div>

          <button onClick={onLogout} className="btn-signout">
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="workspace-main">
        <header className="page-header">
          <div>
            <h1>
              {viewMode === "all" ? "All Workspace Notes" : "My Personal Notes"}
            </h1>
            <p>
              {viewMode === "all"
                ? "Shared workspace feed — view all community notes, edit or delete only your own."
                : "Showing notes created from your personal account."}
            </p>
          </div>

          <div className="header-buttons">
            <button onClick={handleExportTxt} className="btn-ghost">
              Download .TXT
            </button>
            <button onClick={openCreate} className="btn-primary">
              + Create Note
            </button>
          </div>
        </header>

        {/* KPI Cards */}
        <section className="kpi-row">
          <div className="kpi-card">
            <span>Total Shared Notes</span>
            <strong>{allNotes.length}</strong>
          </div>
          <div className="kpi-card">
            <span>Created By You</span>
            <strong className="accent-green">{myNotes.length}</strong>
          </div>
          <div className="kpi-card">
            <span>Shared By Others</span>
            <strong className="accent-blue">
              {Math.max(0, allNotes.length - myNotes.length)}
            </strong>
          </div>
          <div className="kpi-card">
            <span>Pinned Notes</span>
            <strong>{pinnedIds.length}</strong>
          </div>
        </section>

        {/* Visual Category Distribution Bar */}
        {allNotes.length > 0 && (
          <section className="distribution-card">
            <div className="dist-header">
              <span>Workspace Category Breakdown</span>
              <small>
                Study ({countByCat("study")}) • Work ({countByCat("work")}) • Personal (
                {countByCat("personal")}) • Ideas ({countByCat("ideas")})
              </small>
            </div>
            <div className="dist-bar">
              <div
                className="seg study"
                style={{ width: `${(countByCat("study") / totalCount) * 100}%` }}
              />
              <div
                className="seg work"
                style={{ width: `${(countByCat("work") / totalCount) * 100}%` }}
              />
              <div
                className="seg personal"
                style={{ width: `${(countByCat("personal") / totalCount) * 100}%` }}
              />
              <div
                className="seg ideas"
                style={{ width: `${(countByCat("ideas") / totalCount) * 100}%` }}
              />
            </div>
          </section>
        )}

        {/* Filter & Sort Controls */}
        <section className="control-bar">
          <input
            type="text"
            className="search-box"
            placeholder="Search by title or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="category-tabs">
            {["All", "Study", "Work", "Personal", "Ideas"].map((cat) => (
              <button
                key={cat}
                className={`cat-tab ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="right-controls">
            <select
              className="select-box"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="az">Title A–Z</option>
            </select>

            <div className="layout-switch">
              <button
                className={layout === "grid" ? "active" : ""}
                onClick={() => setLayout("grid")}
              >
                Grid
              </button>
              <button
                className={layout === "list" ? "active" : ""}
                onClick={() => setLayout("list")}
              >
                List
              </button>
            </div>
          </div>
        </section>

        {/* Notes Grid / List */}
        {visibleNotes.length === 0 ? (
          <div className="empty-box">
            <h3>No notes found</h3>
            <p>Click &quot;+ Create Note&quot; to add a new note to the workspace.</p>
          </div>
        ) : (
          <section className={layout === "grid" ? "notes-grid" : "notes-list"}>
            {visibleNotes.map((note) => {
              const isOwner = note.userID === currentUserId;
              const isPinned = pinnedIds.includes(note._id);
              const catSlug = note.category.toLowerCase();

              return (
                <article
                  key={note._id}
                  className={`note-card border-${catSlug} ${isPinned ? "is-pinned" : ""}`}
                >
                  <div>
                    <div className="card-top">
                      <div className="tags-left">
                        <span className={`tag tag-${catSlug}`}>{note.category}</span>
                        {isPinned && <span className="tag-pin">Pinned</span>}
                      </div>

                      <div className="tags-right">
                        {isOwner ? (
                          <span className="badge-owner">Your Note</span>
                        ) : (
                          <span className="badge-readonly">Read Only</span>
                        )}
                        <button
                          className={`star-btn ${isPinned ? "starred" : ""}`}
                          onClick={() => togglePin(note._id)}
                          title="Pin note"
                        >
                          ★
                        </button>
                      </div>
                    </div>

                    <h3 className="card-title" onClick={() => setReadingNote(note)}>
                      {note.title}
                    </h3>
                    <p className="card-text">{note.body}</p>
                  </div>

                  <div className="card-footer">
                    <span className="date-text">
                      {note.createdAt
                        ? new Date(note.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Today"}
                    </span>

                    <div className="btn-row">
                      <button
                        onClick={() => setReadingNote(note)}
                        className="action-read"
                      >
                        Read
                      </button>
                      {isOwner ? (
                        <>
                          <button
                            onClick={() => openEdit(note)}
                            className="action-edit"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(note._id)}
                            className="action-del"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="view-only-label">View Only</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>

      {/* ==================== READER MODAL ==================== */}
      {readingNote && (
        <div className="overlay" onClick={() => setReadingNote(null)}>
          <div className="dialog reader-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-top">
              <div className="tags-left">
                <span className={`tag tag-${readingNote.category.toLowerCase()}`}>
                  {readingNote.category}
                </span>
                {readingNote.userID === currentUserId ? (
                  <span className="badge-owner">Your Note</span>
                ) : (
                  <span className="badge-readonly">Read Only</span>
                )}
              </div>
              <button className="icon-close" onClick={() => setReadingNote(null)}>
                ×
              </button>
            </div>

            <h2 className="reader-heading">{readingNote.title}</h2>
            <p className="reader-sub">
              {readingNote.createdAt
                ? new Date(readingNote.createdAt).toLocaleString("en-IN")
                : "Recently created"}{" "}
              • {readingNote.body.trim().split(/\s+/).length} words
            </p>

            <div className="reader-body">{readingNote.body}</div>

            <div className="dialog-actions">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => handleCopy(readingNote)}
              >
                Copy Content
              </button>
              {readingNote.userID === currentUserId && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    const target = readingNote;
                    setReadingNote(null);
                    openEdit(target);
                  }}
                >
                  Edit Note
                </button>
              )}
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setReadingNote(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CREATE / EDIT MODAL ==================== */}
      {showModal && (
        <div className="overlay" onClick={() => setShowModal(false)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-top">
              <h2>{editingId ? "Edit Note" : "Create New Note"}</h2>
              <button className="icon-close" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            {!editingId && (
              <div className="templates-strip">
                <span>Templates:</span>
                <button type="button" onClick={() => applyTemplate("lecture")}>
                  Lecture
                </button>
                <button type="button" onClick={() => applyTemplate("checklist")}>
                  Checklist
                </button>
                <button type="button" onClick={() => applyTemplate("idea")}>
                  Idea
                </button>
              </div>
            )}

            <form onSubmit={handleSave} className="dialog-form">
              <div className="input-group">
                <label>Title</label>
                <input
                  type="text"
                  placeholder="Enter note title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Study">Study</option>
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Ideas">Ideas</option>
                </select>
              </div>

              <div className="input-group">
                <div className="label-between">
                  <label>Content</label>
                  <small>{body.length} chars</small>
                </div>
                <textarea
                  rows="6"
                  placeholder="Write your note..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                />
              </div>

              <div className="dialog-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? "Update Note" : "Publish Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;